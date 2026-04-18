"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Camera, User } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name ?? "");
      }
      setFetching(false);
    }
    fetchProfile();
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("L'avatar ne doit pas dépasser 2MB."); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil mis à jour !");
      setProfile((prev) => prev ? { ...prev, display_name: displayName, avatar_url: avatarUrl } : null);
      setAvatarFile(null);
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="shimmer rounded h-8 w-48" />
        <div className="oriva-card p-8 space-y-6">
          <div className="shimmer rounded-full w-24 h-24" />
          <div className="shimmer rounded h-10 w-full max-w-xs" />
        </div>
      </div>
    );
  }

  const currentAvatar = avatarPreview ?? profile?.avatar_url;

  return (
    <div className="space-y-6 animate-slide-up max-w-lg">
      <div>
        <h1 className="font-display text-3xl text-oriva-cream">Profil</h1>
        <p className="text-oriva-muted text-sm mt-1">Gérez votre identité vendeur</p>
      </div>

      <div className="oriva-card p-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-oriva-surface border-2 border-oriva-border flex items-center justify-center">
                {currentAvatar ? (
                  <Image src={currentAvatar} alt="Avatar" fill className="object-cover" />
                ) : (
                  <User size={32} className="text-oriva-muted" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-oriva-gold flex items-center justify-center cursor-pointer hover:bg-oriva-gold-light transition-colors shadow-gold-sm">
                <Camera size={14} className="text-oriva-black" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-sm text-oriva-cream font-medium">{profile?.display_name ?? "Vendeur"}</p>
              <p className="text-xs text-oriva-muted mt-1">{profile?.email}</p>
              <p className="text-xs text-oriva-gold mt-1 uppercase tracking-widest">Vendeur</p>
            </div>
          </div>

          {/* Nom d'affichage */}
          <div>
            <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
              Nom d'affichage
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="oriva-input"
              placeholder="Votre nom de boutique"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
              Email (non modifiable)
            </label>
            <input
              value={profile?.email ?? ""}
              className="oriva-input opacity-50 cursor-not-allowed"
              disabled
            />
          </div>

          <button
            type="submit"
            className="oriva-btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
