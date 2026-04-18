import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "d MMM yyyy", { locale: fr });
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: fr,
  });
}

export function truncateId(id: string): string {
  return `#${id.substring(0, 8).toUpperCase()}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: "Paiement en attente",
  pending: "En attente",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  payment_pending: "text-oriva-warning bg-oriva-warning/10",
  pending: "text-oriva-gold bg-oriva-gold/10",
  shipped: "text-blue-400 bg-blue-400/10",
  delivered: "text-oriva-success bg-oriva-success/10",
  cancelled: "text-oriva-danger bg-oriva-danger/10",
};
