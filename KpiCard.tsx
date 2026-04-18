import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "gold" | "success" | "warning" | "default";
}

export default function KpiCard({ label, value, icon: Icon, trend, color = "default" }: KpiCardProps) {
  const colors = {
    gold: "text-oriva-gold bg-oriva-gold/10",
    success: "text-oriva-success bg-oriva-success/10",
    warning: "text-oriva-warning bg-oriva-warning/10",
    default: "text-oriva-muted bg-oriva-surface",
  };

  return (
    <div className="oriva-card p-5 hover:border-oriva-gold/20 transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          <Icon size={18} strokeWidth={1.5} />
        </div>
        {trend && (
          <span className="text-xs text-oriva-muted">{trend}</span>
        )}
      </div>
      <div className="font-display text-3xl text-oriva-cream mb-1">{value}</div>
      <div className="text-xs text-oriva-muted uppercase tracking-widest">{label}</div>
    </div>
  );
}
