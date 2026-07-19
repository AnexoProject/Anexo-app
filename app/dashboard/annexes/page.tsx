import { createClient } from "@/lib/supabase/server";
import AnnexeGrid from "./annexe-grid";

export default async function AnnexesPage() {
  const supabase = await createClient();

  const { data: annexes } = await supabase
    .from("annexes")
    .select("id, slot_number, label, icon, is_active")
    .is("deleted_at", null)
    .order("slot_number", { ascending: true });

  const { data: trashedAnnexes } = await supabase
    .from("annexes")
    .select("id, slot_number, label, icon, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-black text-xl text-[#1A2B4B]">VOS RUBRIQUES</h1>
        <p className="text-sm text-[#5B6B80] mt-1">
          Chaque rubrique est un module indépendant que vous configurez et renommez selon votre activité.
        </p>
      </div>
      <AnnexeGrid initialAnnexes={annexes ?? []} initialTrashed={trashedAnnexes ?? []} />
    </div>
  );
}
