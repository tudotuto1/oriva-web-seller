import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductForm from "@/components/products/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <Link href="/products" className="flex items-center gap-2 text-oriva-muted hover:text-oriva-cream text-sm transition-colors mb-4">
          <ArrowLeft size={16} /> Retour au catalogue
        </Link>
        <h1 className="font-display text-3xl text-oriva-cream">Nouveau produit</h1>
        <p className="text-oriva-muted text-sm mt-1">Ajoutez un produit à votre catalogue</p>
      </div>
      <div className="oriva-card p-6">
        <ProductForm vendorId={user.id} />
      </div>
    </div>
  );
}
