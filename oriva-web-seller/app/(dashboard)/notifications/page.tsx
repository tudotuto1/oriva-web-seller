"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import type { Notification } from "@/types/database";

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAndMarkRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications((data as Notification[]) ?? []);
    setLoading(false);

    // Marquer toutes comme lues
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("vendor_id", user.id)
      .eq("is_read", false);
  }

  useEffect(() => { fetchAndMarkRead(); }, []);

  // Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel("notifications-page")
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
          filter: `vendor_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          toast.success(payload.new.message as string);
        })
        .subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-oriva-cream">Notifications</h1>
          <p className="text-oriva-muted text-sm mt-1">Toutes vos alertes en temps réel</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <div className="flex items-center gap-2 text-xs text-oriva-gold">
            <CheckCheck size={14} />
            <span>Marquées comme lues à l'ouverture</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="oriva-card p-4 flex gap-4">
              <div className="shimmer w-2 h-2 rounded-full mt-1 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="shimmer rounded h-4 w-2/3" />
                <div className="shimmer rounded h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="oriva-card p-16 text-center">
          <Bell size={40} className="mx-auto text-oriva-border mb-4" />
          <p className="text-oriva-muted">Aucune notification pour l'instant.</p>
          <p className="text-oriva-muted text-xs mt-2">Vous serez alerté dès qu'une commande arrive.</p>
        </div>
      ) : (
        <div className="oriva-card overflow-hidden">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 transition-colors ${
                i !== notifications.length - 1 ? "border-b border-oriva-border" : ""
              } ${!notif.is_read ? "bg-oriva-gold/3" : ""}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.is_read ? "bg-oriva-border" : "bg-oriva-gold"}`} />
              <div className="flex-1">
                <p className={`text-sm ${notif.is_read ? "text-oriva-muted" : "text-oriva-cream"}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-oriva-muted">{formatRelativeTime(notif.created_at)}</span>
                  {notif.related_order_id && (
                    <Link
                      href="/orders"
                      className="text-xs text-oriva-gold hover:text-oriva-gold-light transition-colors"
                    >
                      Voir la commande →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
