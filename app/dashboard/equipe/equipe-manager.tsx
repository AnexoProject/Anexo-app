"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; full_name: string | null; role: "owner" | "staff" };
type Invite = { id: string; email: string; role: "owner" | "staff"; created_at: string };

export default function EquipeManager({
  initialMembers,
  initialInvites,
  currentUserId,
}: {
  initialMembers: Member[];
  initialInvites: Invite[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function sendInvite() {
    setError("");
    if (!email.trim()) return setError("Indique un email.");
    if (members.some((m) => m.full_name?.toLowerCase() === email.trim().toLowerCase())) {
      // simple garde-fou informatif, la vraie unicité est gérée par la base
    }
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("establishment_id").eq("id", userData.user!.id).single();

    const { data, error: inviteError } = await supabase
      .from("establishment_invites")
      .insert({
        establishment_id: profile?.establishment_id,
        email: email.trim().toLowerCase(),
        role,
        invited_by: currentUserId,
      })
      .select()
      .single();

    setSaving(false);
    if (inviteError) {
      setError(
        inviteError.message.includes("duplicate")
          ? "Une invitation est déjà en attente pour cet email."
          : "Erreur : " + inviteError.message
      );
      return;
    }
    setInvites((i) => [data, ...i]);
    setEmail("");
    router.refresh();
  }

  async function revokeInvite(id: string) {
    await supabase.from("establishment_invites").delete().eq("id", id);
    setInvites((i) => i.filter((x) => x.id !== id));
  }

  async function removeMember(id: string) {
    if (!confirm("Retirer cette personne de l'établissement ? Elle perdra l'accès immédiatement.")) return;
    await supabase.from("profiles").delete().eq("id", id);
    setMembers((m) => m.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-black text-xl text-[#1A2B4B]">ÉQUIPE</h1>
        <p className="text-sm text-[#5B6B80] mt-1">
          Gère qui a accès à Anexo pour ton établissement.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="font-black text-xs text-[#5B6B80] mb-3">MEMBRES ({members.length})</div>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="bg-white border border-[#DCE3EA] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#1A2B4B]">
                    {m.full_name || "Sans nom"} {m.id === currentUserId && <span className="text-xs text-[#5B6B80]">(toi)</span>}
                  </div>
                  <div className="text-xs text-[#5B6B80]">{m.role === "owner" ? "Propriétaire" : "Membre de l'équipe"}</div>
                </div>
                {m.id !== currentUserId && (
                  <button onClick={() => removeMember(m.id)} className="text-xs text-[#5B6B80] hover:text-[#C0392B]">
                    Retirer
                  </button>
                )}
              </div>
            ))}
          </div>

          {invites.length > 0 && (
            <>
              <div className="font-black text-xs text-[#5B6B80] mb-3 mt-6">INVITATIONS EN ATTENTE</div>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="bg-[#F4F7FA] border border-dashed border-[#DCE3EA] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[#1A2B4B]">{inv.email}</div>
                      <div className="text-xs text-[#5B6B80]">{inv.role === "owner" ? "Propriétaire" : "Membre de l'équipe"} · en attente</div>
                    </div>
                    <button onClick={() => revokeInvite(inv.id)} className="text-xs text-[#5B6B80] hover:text-[#C0392B]">
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div className="font-black text-xs text-[#5B6B80] mb-3">INVITER QUELQU&apos;UN</div>
          <div className="bg-white border border-[#DCE3EA] rounded-xl p-5">
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collegue@exemple.fr"
              className="w-full mb-3 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
            />
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "owner" | "staff")}
              className="w-full mb-4 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
            >
              <option value="staff">Membre de l&apos;équipe</option>
              <option value="owner">Propriétaire</option>
            </select>

            {error && <div className="text-sm text-[#C0392B] bg-[#FBE1DC] rounded-lg px-3 py-2 mb-3">{error}</div>}

            <button onClick={sendInvite} disabled={saving} className="w-full bg-[#2473BA] text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
              {saving ? "Envoi..." : "Créer l'invitation"}
            </button>

            <p className="text-xs text-[#5B6B80] mt-4 leading-relaxed">
              ⚠️ Anexo n&apos;envoie pas encore d&apos;email automatique. Une fois l&apos;invitation créée,
              communique toi-même à cette personne le lien de création de compte, en lui précisant de
              bien utiliser <strong>cet email exact</strong> — elle rejoindra alors automatiquement votre
              établissement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
