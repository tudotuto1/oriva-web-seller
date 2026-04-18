"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ShoppingBag, Bell, User, LogOut, Menu, X
} from "lucide-react";
import type { Notification } from "@/types/database";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Produits" },
  { href: "/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setVendorId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    // Charge le nombre initial de notifs non lues
    supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("vendor_id", vendorId)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));

    // Abonnement Realtime
    const channel = supabase
      .channel("notifications-badge")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `vendor_id=eq.${vendorId}`,
      }, () => {
        supabase
          .from("notifications")
          .select("id", { count: "exact" })
          .eq("vendor_id", vendorId)
          .eq("is_read", false)
          .then(({ count }) => setUnreadCount(count ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        const isNotif = href === "/notifications";
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group",
              active
                ? "bg-oriva-gold/10 text-oriva-gold border border-oriva-gold/20"
                : "text-oriva-muted hover:text-oriva-cream hover:bg-oriva-surface"
            )}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              {isNotif && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-oriva-danger rounded-full" />
              )}
            </div>
            <span className="font-medium">{label}</span>
            {isNotif && unreadCount > 0 && (
              <span className="ml-auto bg-oriva-danger/15 text-oriva-danger text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-oriva-surface border-b border-oriva-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-oriva-gold flex items-center justify-center">
            <span className="font-display font-bold text-oriva-black text-xs">O</span>
          </div>
          <span className="font-display text-oriva-cream tracking-wider">ORIVA</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-oriva-muted hover:text-oriva-cream">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-14 left-0 bottom-0 z-40 w-64 bg-oriva-surface border-r border-oriva-border flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavLinks />
        <div className="p-3 border-t border-oriva-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-oriva-muted hover:text-oriva-danger hover:bg-oriva-danger/5 w-full transition-all">
            <LogOut size={18} strokeWidth={1.5} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-56 bg-oriva-surface border-r border-oriva-border flex-col z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-oriva-border">
          <div className="w-7 h-7 rounded-lg bg-oriva-gold flex items-center justify-center">
            <span className="font-display font-bold text-oriva-black text-xs">O</span>
          </div>
          <span className="font-display text-lg text-oriva-cream tracking-wider">ORIVA</span>
        </div>
        <NavLinks />
        <div className="p-3 border-t border-oriva-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-oriva-muted hover:text-oriva-danger hover:bg-oriva-danger/5 w-full transition-all">
            <LogOut size={18} strokeWidth={1.5} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
