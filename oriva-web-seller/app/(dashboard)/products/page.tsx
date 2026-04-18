"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Package, Archive, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatDate } from "@/lib/utils";
import ImageCarouselModal from "@/components/ui/ImageCarouselModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";
import type { Product } from "@/types/database";

export default function ProductsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", user.id)
      .eq("is_archived", tab === "archived")
      .order("created_at", { ascending: false });

    setProducts(data ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleArchive(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({ is_archived: !product.is_archived })
      .eq("id", product.id);
    if (error) { toast.error("Erreur lors de l'archivage."); return; }
    toast.success(product.is_archived ? "Produit restauré." : "Produit archivé.");
    fetchProducts();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    // Supprimer les images du storage
    if (deleteTarget.images.length > 0) {
      const paths = deleteTarget.images.map((url) => {
        const parts = url.split("/product-images/");
        return parts[1] ?? "";
      }).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from("product-images").remove(paths);
    }
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erreur lors de la suppression."); }
    else { toast.success("Produit supprimé définitivement."); }
    setDeleteTarget(null);
    setDeleteLoading(false);
    fetchProducts();
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-oriva-cream">Catalogue</h1>
          <p className="text-oriva-muted text-sm mt-1">Gérez vos produits</p>
        </div>
        <Link href="/products/new" className="oriva-btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau produit
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-oriva-surface border border-oriva-border rounded-lg p-1 w-fit">
          {(["active", "archived"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? "bg-oriva-gold text-oriva-black"
                  : "text-oriva-muted hover:text-oriva-cream"
              }`}
            >
              {t === "active" ? "Actifs" : "Archivés"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-oriva-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="oriva-input pl-9 py-2"
            placeholder="Rechercher..."
          />
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="oriva-card p-4 space-y-3">
              <div className="shimmer rounded-lg h-48 w-full" />
              <div className="shimmer rounded h-4 w-3/4" />
              <div className="shimmer rounded h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="oriva-card p-16 text-center">
          <Package size={40} className="mx-auto text-oriva-border mb-4" />
          <p className="text-oriva-muted">
            {search ? "Aucun produit trouvé." : tab === "active" ? "Aucun produit actif." : "Aucun produit archivé."}
          </p>
          {!search && tab === "active" && (
            <Link href="/products/new" className="oriva-btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={14} /> Créer votre premier produit
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="oriva-card overflow-hidden group hover:border-oriva-gold/20 transition-colors duration-200">
              {/* Image */}
              <div
                className="relative h-48 bg-oriva-surface cursor-pointer overflow-hidden"
                onClick={() => product.images.length > 0 && setSelectedImages(product.images)}
              >
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package size={32} className="text-oriva-border" />
                  </div>
                )}
                {product.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    +{product.images.length - 1}
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2 bg-oriva-danger/90 text-white text-xs px-2 py-0.5 rounded-full">
                    Rupture
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="font-medium text-oriva-cream text-sm truncate">{product.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-oriva-gold font-display text-lg">{formatPrice(product.price)}</span>
                  <span className="text-oriva-muted text-xs">{product.stock} en stock</span>
                </div>
                <p className="text-oriva-muted text-xs mt-1">{formatDate(product.created_at)}</p>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-oriva-border">
                  <Link
                    href={`/products/${product.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-oriva-muted hover:text-oriva-cream hover:bg-oriva-surface transition-all border border-oriva-border"
                  >
                    <Edit2 size={13} /> Modifier
                  </Link>
                  <button
                    onClick={() => toggleArchive(product)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-oriva-muted hover:text-oriva-warning hover:bg-oriva-warning/5 transition-all border border-oriva-border"
                    title={product.is_archived ? "Restaurer" : "Archiver"}
                  >
                    {product.is_archived ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-oriva-muted hover:text-oriva-danger hover:bg-oriva-danger/5 transition-all border border-oriva-border"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ImageCarouselModal
        images={selectedImages ?? []}
        isOpen={!!selectedImages}
        onClose={() => setSelectedImages(null)}
      />
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer ce produit ?"
        message={`"${deleteTarget?.title}" sera supprimé définitivement avec toutes ses images. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
