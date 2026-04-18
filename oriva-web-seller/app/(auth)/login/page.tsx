"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function LoginContent() {
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
    <div className="min-h-screen bg-oriva-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 rounded-lg bg-oriva-gold flex items-center justify-center">
            <span className="font-display font-bold text-oriva-black text-sm">O</span>
          </div>
          <span className="font-display text-xl text-oriva-cream tracking-wider">ORIVA</span>
        </div>
        <h1 className="font-display text-3xl text-oriva-cream mb-2">Connexion</h1>
        <p className="text-oriva-muted text-sm mb-10">Espace réservé aux vendeurs Oriva</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="oriva-input" placeholder="vous@oriva.com" required autoComplete="email" />
          </div>
          <div>
            <label className="block text-xs text-oriva-muted mb-2 uppercase tracking-widest">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="oriva-input pr-12" placeholder="••••••••" required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-oriva-muted hover:text-oriva-cream transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="oriva-btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? (<><Loader2 size={16} className="animate-spin" />Connexion…</>) : ("Se connecter")}
          </button>
        </form>
        <p className="text-center text-oriva-muted text-xs mt-10 border-t border-oriva-border pt-6">
          Accès restreint — les comptes vendeurs sont créés par l&apos;administrateur Oriva.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-oriva-black flex items-center justify-center"><Loader2 size={32} className="animate-spin text-oriva-gold" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
