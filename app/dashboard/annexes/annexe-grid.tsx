"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Annexe = {
  id: string;
  slot_number: number;
  label: string;
  icon: string;
  is_active: boolean;
};
type TrashedAnnexe = {
  id: string;
  slot_number: number;
  label: string;
  icon: string;
  deleted_at: string;
};

const ICON_CHOICES = ["📦", "🚲", "🚗", "⛳", "🧺", "🏊", "🎮", "🛍️", "💆", "🍽️"];

export default function AnnexeGrid({
  initialAnnexes,
  initialTrashed,
}: {
  initialAnnexes: Annexe[];
  initialTrashed: TrashedAnnexe[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [annexes, setAnnexes] = useState(initialAnnexes);
  const [trashed, setTrashed] = useState(initialTrashed);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [busy, setBusy] = useState(false);

  async function createAnnexe() {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setBusy(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("establishment_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile) { setBusy(false); return; }

    const usedSlots = [...annexes, ...trashed].map((a) => a.slot_number);
    const nextSlot = usedSlots.length ? Math.max(...usedSlots) + 1 : 1;

    const { data: newAnnexe, error } = await supabase
      .from("annexes")
      .insert({
        establishment_id: profile.establishment_id,
        slot_number: nextSlot,
        label: `Annexe ${nextSlot}`,
        icon: "📦",
      })
      .select()
      .single();

    setBusy(false);
    if (!error && newAnnexe) {
      setAnnexes((a) => [...a, newAnnexe]);
      setEditingId(newAnnexe.id);
    }
  }

  async function renameAnnexe(id: string, label: string, icon: string) {
    setAnnexes((a) => a.map((x) => (x.id === id ? { ...x, label, icon } : x)));
    await supabase.from("annexes").update({ label, icon }).eq("id", id);
    setEditingId(null);
    router.refresh();
  }

  async function deleteAnnexe(id: string) {
    const annexe = annexes.find((a) => a.id === id);
    if (!annexe) return;
    const now = new Date().toISOString();
    await supabase.from("annexes").update({ deleted_at: now }).eq("id", id);
    setAnnexes((a) => a.filter((x) => x.id !== id));
    setTrashed((t) => [{ ...annexe, deleted_at: now }, ...t]);
    setDeletingId(null);
    router.refresh();
  }

  async function restoreAnnexe(id: string) {
    const annexe = trashed.find((a) => a.id === id);
    if (!annexe) return;
    await supabase.from("annexes").update({ deleted_at: null }).eq("id", id);
    setTrashed((t) => t.filter((x) => x.id !== id));
    setAnnexes((a) => [...a, { id: annexe.id, slot_number: annexe.slot_number, label: annexe.label, icon: annexe.icon, is_active: true }]);
    router.refresh();
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {annexes.map((annexe) =>
          editingId === annexe.id ? (
            <EditCard key={annexe.id} annexe={annexe} onSave={renameAnnexe} onCancel={() => setEditingId(null)} />
          ) : deletingId === annexe.id ? (
            <DeleteConfirmCard
              key={annexe.id}
              annexe={annexe}
              onConfirm={() => deleteAnnexe(annexe.id)}
              onCancel={() => setDeletingId(null)}
            />
          ) : (
            <div
              key={annexe.id}
              className="bg-white border border-[#DCE3EA] rounded-xl p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{annexe.icon}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                  <button onClick={() => setEditingId(annexe.id)} className="text-xs text-[#5B6B80] hover:text-[#2473BA]">
                    Renommer
                  </button>
                  <button onClick={() => setDeletingId(annexe.id)} className="text-xs text-[#5B6B80] hover:text-[#C0392B]">
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="text-xs text-[#5B6B80] mb-1 font-mono">Annexe {annexe.slot_number}</div>
              <div className="font-semibold text-[#1A2B4B] mb-4">{annexe.label}</div>
              <Link href={`/dashboard/annexe/${annexe.id}`} className="text-sm font-semibold text-[#2473BA]">
                Gérer →
              </Link>
            </div>
          )
        )}

        <button
          onClick={createAnnexe}
          disabled={busy}
          className="border-2 border-dashed border-[#DCE3EA] rounded-xl p-5 flex flex-col items-center justify-center text-[#5B6B80] hover:border-[#2473BA] hover:text-[#2473BA] transition-colors min-h-[140px]"
        >
          <span className="text-2xl mb-2">＋</span>
          <span className="text-sm font-semibold">{busy ? "Création..." : "Ajouter une annexe"}</span>
        </button>
      </div>

      {trashed.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowTrash((s) => !s)}
            className="text-xs font-semibold text-[#5B6B80] hover:text-[#2473BA] flex items-center gap-1"
          >
            🗑️ Corbeille ({trashed.length}) {showTrash ? "▲" : "▼"}
          </button>
          {showTrash && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
              {trashed.map((annexe) => (
                <div key={annexe.id} className="bg-[#F4F7FA] border border-dashed border-[#DCE3EA] rounded-xl p-5 opacity-75">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl grayscale">{annexe.icon}</span>
                  </div>
                  <div className="font-semibold text-[#5B6B80] mb-1">{annexe.label}</div>
                  <div className="text-xs text-[#5B6B80] mb-4">
                    Supprimée le {new Date(annexe.deleted_at).toLocaleDateString("fr-FR")}
                  </div>
                  <button onClick={() => restoreAnnexe(annexe.id)} className="text-sm font-semibold text-[#2473BA]">
                    ↺ Restaurer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditCard({
  annexe,
  onSave,
  onCancel,
}: {
  annexe: Annexe;
  onSave: (id: string, label: string, icon: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(annexe.label);
  const [icon, setIcon] = useState(annexe.icon);

  return (
    <div className="bg-white border-2 border-[#2473BA] rounded-xl p-5">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ICON_CHOICES.map((i) => (
          <button
            key={i}
            onClick={() => setIcon(i)}
            className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center ${
              icon === i ? "bg-[#E4EFF9] ring-2 ring-[#2473BA]" : "bg-[#F4F7FA]"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA] mb-3"
        placeholder="Ex : Vélos, Laverie, Mini-golf..."
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(annexe.id, label || annexe.label, icon)}
          className="flex-1 bg-[#2473BA] text-white text-sm font-semibold rounded-lg py-2"
        >
          Enregistrer
        </button>
        <button onClick={onCancel} className="px-3 text-sm text-[#5B6B80]">
          Annuler
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmCard({
  annexe,
  onConfirm,
  onCancel,
}: {
  annexe: Annexe;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim().toLowerCase() === annexe.label.trim().toLowerCase();

  return (
    <div className="bg-white border-2 border-[#C0392B] rounded-xl p-5">
      <div className="text-sm font-semibold text-[#C0392B] mb-2">Supprimer &quot;{annexe.label}&quot; ?</div>
      <p className="text-xs text-[#5B6B80] mb-3">
        Ses articles, tarifs et réservations seront masqués. Vous pourrez tout restaurer depuis la corbeille
        pendant un temps si c&apos;est une erreur.
      </p>
      <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1">
        Tapez &quot;{annexe.label}&quot; pour confirmer
      </label>
      <input
        autoFocus
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#C0392B] mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!canDelete}
          className="flex-1 bg-[#C0392B] text-white text-sm font-semibold rounded-lg py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Supprimer
        </button>
        <button onClick={onCancel} className="px-3 text-sm text-[#5B6B80]">
          Annuler
        </button>
      </div>
    </div>
  );
}
