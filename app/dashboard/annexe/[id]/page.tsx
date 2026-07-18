import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnnexeManager from "./annexe-manager";

export default async function AnnexeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: annexe } = await supabase.from("annexes").select("*").eq("id", id).single();
  if (!annexe) notFound();

  const { data: items } = await supabase
    .from("annexe_items")
    .select("*, annexe_item_plans(*)")
    .eq("annexe_id", id)
    .order("created_at", { ascending: true });

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, reservation_lines(*, annexe_items(name), annexe_item_plans(label, unit))")
    .eq("annexe_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AnnexeManager
      annexe={annexe}
      initialItems={items ?? []}
      initialReservations={reservations ?? []}
    />
  );
}
