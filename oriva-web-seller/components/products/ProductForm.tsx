"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, X, Calculator } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/database";
import type { Category } from "@/lib/categories";
import CategorySelect from "@/components/products/CategorySelect";

const CLOTHING_CATEGORY_ID = "fbb5ef2e-b780-4a7f-a248-765746d0406d";
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Taille unique"];
const COLOR_OPTIONS: { name: string; hex: string }[] = [
  { name: "rouge", hex: "#DC2626" },
  { name: "jaune", hex: "#EAB308" },
  { name: "vert", hex: "#16A34A" },
  { name: "marron", hex: "#92400E" },
  { name: "bleu", hex: "#2563EB" },
  { name: "violet", hex: "#7C3AED" },
  { name: "orange", hex: "#EA580C" },
  { name: "noir", hex: "#111111" },
  { name: "blanc", hex: "#FFFFFF" },
  { name: "rose", hex: "#EC4899" },
  { name: "gris", hex: "#6B7280" },
];

interface ProductFormProps {
  product?: Product;
  vendorId: string;
  categories: Category[];
}

interface PricingPreview {
  vendor_price_cny: number;
  weight_grams: number;
  exchange_rate: number;
  vendor_price_fcfa: number;
  commission_percent: number;
  commission_fcfa: number;
  display_price: number;
}

export default function ProductForm({ product, vendorId, categories }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [vendorPriceCny, setVendorPriceCny] = useState(product?.vendor_price_cny?.toString() ?? "");
  const [weightGrams, setWeightGrams] = useState(product?.weight_grams?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null);
  const [sizes, setSizes] = useState<string[]>(product?.available_sizes ?? []);
  const isClothing = categoryId === CLOTHING_CATEGORY_ID;

  function toggleSize(s: string) {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const [colors, setColors] = useState<string[]>(product?.available_colors ?? []);

  function toggleColor(c: string) {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [shippingEstimate, setShippingEstimate] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Aperçu prix temps réel (debounced 500ms)
  useEffect(() => {
    const cny = Number(vendorPriceCny);
    const g = Number(weightGrams);
    if (!cny || cny <= 0 || !g || g <= 0) {
      setPreview(null);
      setShippingEstimate(null);
      return;
    }

    const handle = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const [pricingRes, shippingRes] = await Promise.all([
          supabase.rpc("calculate_product_pricing", {
            p_vendor_price_cny: cny,
            p_weight_grams: g,
          }),
          supabase.rpc("calculate_shipping_fee", {
            p_total_weight_grams: g,
          }),
        ]);
        if (!pricingRes.error && pricingRes.data) {
          setPreview(pricingRes.data as PricingPreview);
        }
        if (!shippingRes.error && shippingRes.data != null) {
          setShippingEstimate(shippingRes.data as number);
        }
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [vendorPriceCny, weightGrams, supabase]);

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < accepted.length) toast.error("Certaines images dépassent 5MB.");
    setNewFiles((prev) => [...prev, ...valid].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 10,
  });

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of newFiles) {
      const ext = file.name.split(".").pop();
      const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(`Erreur upload: ${file.name}`); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Le titre est requis."); return; }
    const cny = Number(vendorPriceCny);
    const g = Number(weightGrams);
    if (!cny || cny <= 0) { toast.error("Prix vendeur (CNY) invalide."); return; }
    if (!g || g <= 0) { toast.error("Poids (g) invalide."); return; }
    if (!preview) { toast.error("Aperçu prix indisponible. Vérifiez CNY et poids."); return; }

    if (isClothing && sizes.length === 0) {
      toast.error("Sélectionnez au moins une taille disponible.");
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls = await uploadImages();
      const allImages = [...existingImages, ...uploadedUrls];

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price: preview.display_price,
        vendor_price_cny: cny,
        weight_grams: g,
        currency: "CNY" as const,
        stock: Number(stock) || 0,
        images: allImages,
        category_id: categoryId,
        available_sizes: isClothing ? sizes : null,
        available_colors: colors.length > 0 ? colors : null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product!.id);
        if (error) throw error;
        toast.success("Produit mis à jour !");
      } else {
        const { error } = await supabase
          .from("products")
          .insert({ ...payload, vendor_id: vendorId });
        if (error) throw error;
        toast.success("Produit créé !");
      }
      router.push("/products");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      toast.error(`Erreur : ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Titre */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Titre *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="oriva-input"
          placeholder="Nom du produit"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="oriva-input resize-none"
          rows={4}
          placeholder="Décrivez votre produit..."
        />
      </div>

      {/* Prix CNY + Poids */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
            Prix vendeur (¥ CNY) *
          </label>
          <input
            type="number"
            value={vendorPriceCny}
            onChange={(e) => setVendorPriceCny(e.target.value)}
            className="oriva-input"
            placeholder="20"
            min="1"
            step="1"
            required
          />
          <p className="text-xs text-oriva-muted/70 mt-1.5">Coût d&apos;achat en Chine (yuan).</p>
        </div>
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Poids (g) *</label>
          <input
            type="number"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            className="oriva-input"
            placeholder="350"
            min="1"
            step="1"
            required
          />
          <p className="text-xs text-oriva-muted/70 mt-1.5">Poids unitaire de l&apos;article.</p>
        </div>
      </div>

      {/* Stock */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Stock</label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="oriva-input max-w-xs"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Aperçu prix client */}
      <div className="rounded-xl border border-oriva-gold/20 bg-oriva-gold/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={16} className="text-oriva-gold" />
          <h3 className="text-sm font-medium text-oriva-cream uppercase tracking-widest">
            Aperçu prix client
          </h3>
        </div>
        {previewLoading ? (
          <p className="text-oriva-muted text-sm">Calcul en cours…</p>
        ) : preview ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-oriva-muted">Prix affiché client</span>
              <span className="text-oriva-gold font-display text-xl">
                {formatPrice(preview.display_price)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-oriva-muted/70">
              <span>Taux change appliqué</span>
              <span>{preview.exchange_rate} FCFA/¥</span>
            </div>
            <div className="flex justify-between text-xs text-oriva-muted/70">
              <span>Coût vendeur converti</span>
              <span>{formatPrice(preview.vendor_price_fcfa)}</span>
            </div>
            <div className="flex justify-between text-xs text-oriva-muted/70">
              <span>Marge Oriva ({preview.commission_percent}%)</span>
              <span>{formatPrice(preview.commission_fcfa)}</span>
            </div>
            {shippingEstimate !== null && (
              <div className="flex justify-between text-xs text-oriva-muted/70 pt-2 border-t border-oriva-border">
                <span>Livraison estimée (poids unitaire)</span>
                <span>{formatPrice(shippingEstimate)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-oriva-muted text-sm">
            Saisissez prix CNY et poids pour voir le prix client final.
          </p>
        )}
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Catégorie</label>
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          disabled={loading}
        />
        <p className="text-xs text-oriva-muted/70 mt-1.5">Aide les clients à filtrer dans l&apos;app.</p>
      </div>

      {isClothing && (
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
            Tailles disponibles *
          </label>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((s) => {
              const active = sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    active
                      ? "border-oriva-gold bg-oriva-gold/10 text-oriva-gold"
                      : "border-oriva-border text-oriva-muted hover:border-oriva-gold/40"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-oriva-muted/70 mt-1.5">
            Obligatoire pour les vêtements. Le client choisira parmi ces tailles.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
          Couleurs disponibles (facultatif)
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => {
            const active = colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleColor(c.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm capitalize transition-all ${
                  active
                    ? "border-oriva-gold bg-oriva-gold/10 text-oriva-gold"
                    : "border-oriva-border text-oriva-muted hover:border-oriva-gold/40"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-oriva-muted/70 mt-1.5">
          Le client choisira une couleur. Vous serez notifié de la couleur exacte à livrer.
        </p>
      </div>

      {/* Images existantes */}
      {existingImages.length > 0 && (
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Images actuelles</label>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-oriva-border group">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropzone nouvelles images */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
          {isEdit ? "Ajouter des images" : "Images"} (max 10 · 5MB chacune)
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-oriva-gold bg-oriva-gold/5"
              : "border-oriva-border hover:border-oriva-gold/40 hover:bg-oriva-surface"
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={24} className="mx-auto mb-3 text-oriva-muted" />
          <p className="text-sm text-oriva-muted">
            {isDragActive ? "Déposez les images ici" : "Glissez-déposez ou cliquez pour sélectionner"}
          </p>
          <p className="text-xs text-oriva-muted/60 mt-1">JPG, PNG, WebP</p>
        </div>

        {newFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {newFiles.map((file, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-oriva-gold/30 group">
                <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X size={16} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-oriva-gold/80 text-black text-xs text-center py-0.5">
                  Nouveau
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="oriva-btn-ghost"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="oriva-btn-primary flex items-center gap-2"
          disabled={loading || !preview}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
          ) : (
            isEdit ? "Mettre à jour" : "Créer le produit"
          )}
        </button>
      </div>
    </form>
  );
}
