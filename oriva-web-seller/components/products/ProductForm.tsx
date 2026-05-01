"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, X, Info } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import type { Product } from "@/types/database";

interface ProductFormProps {
  product?: Product;
  vendorId: string;
}

export default function ProductForm({ product, vendorId }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [vendorPriceCny, setVendorPriceCny] = useState(
    product?.vendor_price_cny?.toString() ?? ""
  );
  const [weightGrams, setWeightGrams] = useState(
    product?.weight_grams?.toString() ?? ""
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

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

  /**
   * Calcule le pricing complet via la RPC Supabase calculate_product_pricing.
   * Retourne null si erreur (le caller gère le toast d'erreur).
   */
  async function fetchPricing(cny: number, grams: number) {
    const { data, error } = await supabase.rpc("calculate_product_pricing", {
      p_vendor_price_cny: cny,
      p_weight_grams: grams,
    });
    if (error) {
      console.error("calculate_product_pricing error:", error);
      toast.error("Erreur de calcul du prix. Vérifiez le taux de change.");
      return null;
    }
    return data as {
      vendor_price_cny: number;
      exchange_rate: number;
      vendor_price_fcfa: number;
      commission_percent: number;
      commission_fcfa: number;
      display_price: number;
      weight_grams: number;
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    const cnyNum = Number(vendorPriceCny);
    if (!vendorPriceCny || isNaN(cnyNum) || cnyNum <= 0) {
      toast.error("Prix d'achat (CNY) invalide.");
      return;
    }
    const weightNum = Number(weightGrams);
    if (!weightGrams || isNaN(weightNum) || weightNum <= 0) {
      toast.error("Poids (g) invalide.");
      return;
    }
    const stockNum = Number(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock invalide.");
      return;
    }

    setLoading(true);
    try {
      // 1. Calculer le pricing côté serveur (snapshot du moment)
      const pricing = await fetchPricing(cnyNum, weightNum);
      if (!pricing) {
        setLoading(false);
        return;
      }

      // 2. Upload images
      const uploadedUrls = await uploadImages();
      const allImages = [...existingImages, ...uploadedUrls];

      // 3. Préparer le payload (incl. price legacy = display_price pour compat)
      const payload = {
        title,
        description,
        price: pricing.display_price,                     // legacy compat
        stock: stockNum,
        images: allImages,
        vendor_price_cny: cnyNum,
        weight_grams: weightNum,
        currency: "CNY" as const,
        vendor_price_fcfa_at_creation: pricing.vendor_price_fcfa,
        exchange_rate_at_creation: pricing.exchange_rate,
      };

      // 4. INSERT ou UPDATE
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
          .insert({ vendor_id: vendorId, ...payload });
        if (error) throw error;
        toast.success("Produit créé !");
      }

      router.push("/products");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Titre */}
      <div>
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
          Titre *
        </label>
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
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="oriva-input resize-none"
          rows={4}
          placeholder="Décrivez votre produit..."
        />
      </div>

      {/* Prix d'achat CNY + Poids */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
            Prix d'achat (CNY) *
          </label>
          <input
            type="number"
            value={vendorPriceCny}
            onChange={(e) => setVendorPriceCny(e.target.value)}
            className="oriva-input"
            placeholder="Ex: 50"
            min="0"
            step="1"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
            Poids (g) *
          </label>
          <input
            type="number"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            className="oriva-input"
            placeholder="Ex: 300"
            min="1"
            step="1"
            required
          />
        </div>
      </div>

      {/* Note explicative discrète */}
      <div className="flex gap-2 items-start text-xs text-oriva-muted bg-oriva-surface/50 border border-oriva-border rounded-lg px-3 py-2">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Le prix de vente final affiché aux clients (incluant la conversion FCFA,
          les frais de service Oriva et la livraison) est calculé automatiquement.
        </p>
      </div>

      {/* Stock */}
      <div className="max-w-[50%]">
        <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
          Stock
        </label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="oriva-input"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Images existantes */}
      {existingImages.length > 0 && (
        <div>
          <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
            Images actuelles
          </label>
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
          disabled={loading}
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
