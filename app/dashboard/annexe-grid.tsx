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

const ICON_CHOICES = ["📦", "🚲", "🚗", "⛳", "🧺", "🏊", "🎮", "🛍️", "💆", "🍽️"];

export default function AnnexeGrid({ initialAnnexes }: { initialAnnexes: Annexe[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [annexes, setAnnexes] = useState(initialAnnexes);
  const [editingId, setEditingId] = useState<string | null>(null);
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

    const nextSlot = annexes.length ? Math.max(...annexes.map((a) => a.slot_number)) + 1 : 1;

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

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {annexes.map((annexe) =>
        editingId === annexe.id ? (
          <EditCard key={annexe.id} annexe={annexe} onSave={renameAnnexe} onCancel={() => setEditingId(null)} />
        ) : (
          <div
            key={annexe.id}
            className="bg-white border border-[#DCE3EA] rounded-xl p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{annexe.icon}</span>
              <button
                onClick={() => setEditingId(annexe.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-[#5B6B80] hover:text-[#2473BA]"
              >
                Renommer
              </button>
            </div>
            <div className="text-xs text-[#5B6B80] mb-1 font-mono">Annexe {annexe.slot_number}</div>
            <div className="font-semibold text-[#1A2B4B] mb-4">{annexe.label}</div>
            <Link
              href={`/dashboard/annexe/${annexe.id}`}
              className="text-sm font-semibold text-[#2473BA]"
            >
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
