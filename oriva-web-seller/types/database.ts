export type UserRole = "vendor" | "client";

export type OrderStatus =
  | "payment_pending"
  | "pending"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  price: number;                                     // legacy = display_price snapshot (pour compat app Flutter)
  stock: number;
  images: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Phase 2.5.3.5
  vendor_price_cny: number | null;
  weight_grams: number | null;
  currency: "CNY" | "FCFA" | null;
  vendor_price_fcfa_at_creation: number | null;
  exchange_rate_at_creation: number | null;
  category_id: string | null;
}

export interface Order {
  id: string;
  buyer_id: string;
  vendor_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_address: ShippingAddress | null;
  buyer_email: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  buyer?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  title_snapshot: string;
  image_snapshot: string | null;
  price_snapshot: number;
  quantity: number;
  created_at: string;
  // Phase 2.5.3.5 snapshots complets
  vendor_price_cny_snapshot: number | null;
  exchange_rate_snapshot: number | null;
  vendor_price_fcfa_snapshot: number | null;
  commission_percent_snapshot: number | null;
  commission_fcfa_snapshot: number | null;
  display_price_snapshot: number | null;
  weight_grams_snapshot: number | null;
}

export interface Notification {
  id: string;
  vendor_id: string;
  message: string;
  type: string;
  related_order_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface DashboardStats {
  vendor_id: string;
  total_products: number;
  active_products: number;
  pending_orders: number;
  total_revenue: number;
}
