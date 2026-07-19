"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Math.random().toString(36).slice(2, 7);
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ fullName: "", establishmentName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Erreur lors de la création du compte.");
      setLoading(false);
      return;
    }

    // Sur certains projets Supabase, signUp() ne renvoie pas toujours une session
    // active immédiatement même avec la confirmation email désactivée. On force
    // une connexion explicite pour être certain d'avoir une session valide avant
    // d'insérer des données protégées par la sécurité au niveau des lignes (RLS).
    let session = signUpData.session;
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError || !signInData.session) {
        setError(
          "Compte créé, mais la connexion automatique a échoué (" +
            (signInError?.message || "session manquante") +
            "). Essayez de vous connecter manuellement avec le lien ci-dessous."
        );
        setLoading(false);
        return;
      }
      session = signInData.session;
    }

    const userId = signUpData.user.id;

    // Crée l'établissement (le "tenant")
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .insert({ name: form.establishmentName, slug: slugify(form.establishmentName) })
      .select()
      .single();

    if (estError || !establishment) {
      setError("Compte créé, mais l'établissement n'a pas pu être enregistré : " + estError?.message);
      setLoading(false);
      return;
    }

    // Lie le profil utilisateur à l'établissement, en tant que propriétaire
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      establishment_id: establishment.id,
      full_name: form.fullName,
      role: "owner",
    });

    if (profileError) {
      setError("Établissement créé, mais le profil n'a pas pu être lié : " + profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
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
          <p className="text-sm text-[#5B6B80] mt-1">Créez le compte de votre établissement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Votre nom</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
              placeholder="Paul Martin"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Nom de l'établissement</label>
            <input
              required
              value={form.establishmentName}
              onChange={(e) => setForm((f) => ({ ...f, establishmentName: e.target.value }))}
              className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
              placeholder="Camping Les Mouettes"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
              placeholder="vous@camping.fr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Mot de passe</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm text-[#5B6B80] mt-5">
          Déjà un compte ?{" "}
          <a href="/login" className="text-[#2473BA] font-semibold">Se connecter</a>
        </p>
      </div>
    </div>
  );
}
