import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";
import type { Product } from "@/types/database";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name_fr)")
    .eq("id", id)
    .eq("is_archived", false)
    .single();
  if (!data) return null;

  const { data: pricing } = await supabase
    .from("products_with_pricing")
    .select("display_price")
    .eq("id", id)
    .single();

  return { ...(data as Product), display_price: pricing?.display_price } as Product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Produit introuvable — Oriva" };
  }

  const description = product.description?.slice(0, 160) ?? "Découvrez ce produit sur Oriva.";
  const image = product.images?.[0];

  return {
    title: `${product.title} — Oriva`,
    description,
    openGraph: {
      title: product.title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const mainImage = product.images?.[0];
  const inStock = product.stock > 0;

  return (
    <main className="min-h-screen bg-oriva-black text-oriva-cream">
      <header className="border-b border-oriva-border">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <span className="font-display text-2xl tracking-wide text-oriva-gold">Oriva</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="oriva-card overflow-hidden aspect-square relative bg-oriva-surface">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-oriva-muted text-sm">
                Aucune image
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.categories?.name_fr && (
              <span className="text-xs uppercase tracking-widest text-oriva-gold mb-2">
                {product.categories.name_fr}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-4xl text-oriva-cream leading-tight">
              {product.title}
            </h1>
            <p className="text-2xl text-oriva-gold font-medium mt-4">
              {formatPrice((product as any).display_price ?? product.price)}
            </p>

            <div className="mt-3">
              {inStock ? (
                <span className="status-badge text-oriva-success bg-oriva-success/10">
                  En stock
                </span>
              ) : (
                <span className="status-badge text-oriva-danger bg-oriva-danger/10">
                  Rupture de stock
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-oriva-muted text-sm leading-relaxed mt-6 whitespace-pre-line">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-oriva-border mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-oriva-muted">
          Propulsé par <span className="text-oriva-gold">Oriva</span>
        </div>
      </footer>
    </main>
  );
}
