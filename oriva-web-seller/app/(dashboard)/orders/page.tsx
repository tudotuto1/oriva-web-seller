"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Mail, ChevronDown } from "lucide-react";
import {
  formatPrice, formatDate, truncateId,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS
} from "@/lib/utils";
import toast from "react-hot-toast";
import type { Order, OrderStatus } from "@/types/database";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "shipped",
  shipped: "delivered",
};

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  payment_pending: ["payment_pending"],
  pending: ["pending", "shipped"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

export default function OrdersPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const activeStatuses = ["pending", "shipped"];
    const historyStatuses = ["delivered", "cancelled", "payment_pending"];

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(title_snapshot, quantity, price_snapshot, image_snapshot)")
      .eq("vendor_id", user.id)
      .in("status", tab === "active" ? activeStatuses : historyStatuses)
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel("orders-page")
        .on("postgres_changes", {
          event: "*", schema: "public", table: "orders",
          filter: `vendor_id=eq.${user.id}`,
        }, () => fetchOrders())
        .subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) toast.error("Erreur mise à jour statut.");
    else toast.success(`Statut mis à jour : ${ORDER_STATUS_LABELS[newStatus]}`);
    setUpdatingId(null);
    fetchOrders();
  }

  function contactBuyer(email: string) {
    window.location.href = `mailto:${email}?subject=Votre commande Oriva`;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-3xl text-oriva-cream">Commandes</h1>
        <p className="text-oriva-muted text-sm mt-1">Gérez et suivez vos commandes</p>
      </div>

      <div className="flex bg-oriva-surface border border-oriva-border rounded-lg p-1 w-fit">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              tab === t ? "bg-oriva-gold text-oriva-black" : "text-oriva-muted hover:text-oriva-cream"
            }`}
          >
            {t === "active" ? "Actives" : "Historique"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="oriva-card p-5 space-y-3">
              <div className="shimmer rounded h-4 w-1/4" />
              <div className="shimmer rounded h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="oriva-card p-16 text-center">
          <ShoppingBag size={40} className="mx-auto text-oriva-border mb-4" />
          <p className="text-oriva-muted">
            {tab === "active" ? "Aucune commande active." : "Aucune commande dans l'historique."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="oriva-card p-5 hover:border-oriva-gold/20 transition-colors">
              {/* Header commande */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg text-oriva-cream">{truncateId(order.id)}</span>
                    <span className={`status-badge ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="text-oriva-muted text-xs mt-1">
                    {formatDate(order.created_at)}
                    {order.buyer_email && ` · ${order.buyer_email}`}
                  </div>
                </div>
                <div className="font-display text-2xl text-oriva-gold">
                  {formatPrice(order.total)}
                </div>
              </div>

              {/* Articles */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="bg-oriva-surface rounded-lg p-3 mb-4 space-y-2">
                  {order.order_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-oriva-muted">
                        {item.title_snapshot} <span className="text-oriva-border">×{item.quantity}</span>
                      </span>
                      <span className="text-oriva-cream">{formatPrice(item.price_snapshot * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-oriva-border pt-2 flex justify-between text-xs text-oriva-muted">
                    <span>Livraison</span>
                    <span>{formatPrice(order.shipping_fee)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {/* Dropdown statut */}
                {STATUS_TRANSITIONS[order.status]?.length > 1 && (
                  <div className="relative group">
                    <button className="oriva-btn-primary flex items-center gap-2 text-xs py-2">
                      Modifier statut <ChevronDown size={14} />
                    </button>
                    <div className="absolute top-full left-0 mt-1 bg-oriva-card border border-oriva-border rounded-lg shadow-card overflow-hidden z-10 hidden group-hover:block min-w-[180px]">
                      {STATUS_TRANSITIONS[order.status]
                        .filter((s) => s !== order.status)
                        .map((status) => (
                          <button
                            key={status}
                            onClick={() => updateStatus(order.id, status)}
                            disabled={updatingId === order.id}
                            className="w-full text-left px-4 py-2.5 text-sm text-oriva-muted hover:text-oriva-cream hover:bg-oriva-surface transition-colors"
                          >
                            → {ORDER_STATUS_LABELS[status]}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Contact client */}
                {order.buyer_email && (
                  <button
                    onClick={() => contactBuyer(order.buyer_email!)}
                    className="oriva-btn-ghost flex items-center gap-2 text-xs py-2"
                  >
                    <Mail size={14} /> Contacter le client
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
