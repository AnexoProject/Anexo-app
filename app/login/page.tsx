"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
      <div className="w-full max-w-md bg-white border border-[#DCE3EA] rounded-2xl p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="font-black text-2xl text-[#1A2B4B]">
            anex<span className="text-[#2473BA]">o</span>
          </div>
          <p className="text-sm text-[#5B6B80] mt-1">Connectez-vous à votre établissement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
              placeholder="vous@camping.fr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Mot de passe</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-[#C0392B] bg-[#FBE1DC] rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A2B4B] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-[#5B6B80] mt-5">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-[#2473BA] font-semibold">Créer un établissement</a>
        </p>
      </div>
    </div>
  );
}
