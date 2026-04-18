import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import { formatPrice, formatRelativeTime, truncateId, ORDER_STATUS_LABELS } from "@/lib/utils";
import Link from "next/link";
import type { Order, Notification } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: stats } = await supabase
    .from("vendor_dashboard_stats")
    .select("*")
    .eq("vendor_id", user.id)
    .single();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, order_items(title_snapshot, quantity)")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: Order[] | null };

  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5) as { data: Notification[] | null };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-oriva-cream">
          {greeting}, <span className="text-oriva-gold">{profile?.display_name ?? "Vendeur"}</span>
        </h1>
        <p className="text-oriva-muted text-sm mt-1">Vue d'ensemble de votre boutique</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Produits actifs"
          value={stats?.active_products ?? 0}
          icon={Package}
          color="gold"
        />
        <KpiCard
          label="Total produits"
          value={stats?.total_products ?? 0}
          icon={Package}
          color="default"
        />
        <KpiCard
          label="Commandes en attente"
          value={stats?.pending_orders ?? 0}
          icon={Clock}
          color="warning"
        />
        <KpiCard
          label="Revenus totaux"
          value={formatPrice(stats?.total_revenue ?? 0)}
          icon={TrendingUp}
          color="success"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Commandes récentes */}
        <div className="oriva-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg text-oriva-cream">Commandes récentes</h2>
            <Link href="/orders" className="text-xs text-oriva-gold hover:text-oriva-gold-light transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-oriva-border last:border-0">
                  <div>
                    <div className="text-sm text-oriva-cream font-medium">{truncateId(order.id)}</div>
                    <div className="text-xs text-oriva-muted mt-0.5">
                      {order.buyer_email} · {formatRelativeTime(order.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-oriva-gold">{formatPrice(order.total)}</div>
                    <div className="text-xs text-oriva-muted mt-0.5">
                      {ORDER_STATUS_LABELS[order.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-oriva-muted text-sm">Aucune commande pour l'instant</div>
          )}
        </div>

        {/* Notifications récentes */}
        <div className="oriva-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg text-oriva-cream">Activité récente</h2>
            <Link href="/notifications" className="text-xs text-oriva-gold hover:text-oriva-gold-light transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentNotifs && recentNotifs.length > 0 ? (
            <div className="space-y-3">
              {recentNotifs.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 py-3 border-b border-oriva-border last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.is_read ? "bg-oriva-border" : "bg-oriva-gold"}`} />
                  <div>
                    <div className={`text-sm ${notif.is_read ? "text-oriva-muted" : "text-oriva-cream"}`}>
                      {notif.message}
                    </div>
                    <div className="text-xs text-oriva-muted mt-0.5">{formatRelativeTime(notif.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-oriva-muted text-sm">Aucune activité récente</div>
          )}
        </div>
      </div>
    </div>
  );
}
