export const dynamic = 'force-dynamic';

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      toast.error("Accès refusé — compte vendeur requis.");
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-oriva-black flex">
      {/* Panel gauche — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.08) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, rgba(201,169,110,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-oriva-gold flex items-center justify-center">
              <span className="font-display font-bold text-oriva-black text-sm">O</span>
            </div>
            <span className="font-display text-xl text-oriva-cream tracking-wider">ORIVA</span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="font-display text-5xl text-oriva-cream leading-tight mb-6">
            Gérez votre<br />
            <span className="text-oriva-gold">boutique</span><br />
            avec précision.
          </p>
          <p className="text-oriva-muted text-sm leading-relaxed max-w-xs">
            Portail vendeur sécurisé. Catalogue, commandes, notifications — tout en un seul endroit.
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[
            { label: "Sécurité RLS", value: "100%" },
            { label: "Sync temps réel", value: "✓" },
            { label: "Multi-images", value: "✓" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-oriva-gold font-display text-2xl">{stat.value}</div>
              <div className="text-oriva-muted text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-oriva-gold flex items-center justify-center">
              <span className="font-display font-bold text-oriva-black text-sm">O</span>
            </div>
            <span className="font-display text-xl text-oriva-cream tracking-wider">ORIVA</span>
          </div>

          <h1 className="font-display text-3xl text-oriva-cream mb-2">
            Connexion
          </h1>
          <p className="text-oriva-muted text-sm mb-10">
            Espace réservé aux vendeurs Oriva
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="oriva-input"
                placeholder="vous@oriva.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="oriva-input pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oriva-muted hover:text-oriva-cream transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="oriva-btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="text-center text-oriva-muted text-xs mt-10 border-t border-oriva-border pt-6">
            Accès restreint — les comptes vendeurs sont créés par l'administrateur Oriva.
          </p>
        </div>
      </div>
    </div>
  );
}
