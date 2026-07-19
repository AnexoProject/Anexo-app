import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnnexeManager from "./annexe-manager";

export default async function AnnexeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: annexe } = await supabase.from("annexes").select("*").eq("id", id).is("deleted_at", null).single();
  if (!annexe) notFound();

  const { data: items } = await supabase
    .from("annexe_items")
    .select("*, annexe_item_plans(*)")
    .eq("annexe_id", id)
    .order("created_at", { ascending: true });

  const { data: equipment } = await supabase
    .from("annexe_equipment")
    .select("*")
    .eq("annexe_id", id)
    .order("created_at", { ascending: true });

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, client_name, num_people, start_date, total, status, comment, reservation_lines(*, annexe_items(name), annexe_item_plans(label, unit)), reservation_equipment_lines(*, annexe_equipment(name))"
    )
    .eq("annexe_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AnnexeManager
      annexe={annexe}
      initialItems={items ?? []}
      initialEquipment={equipment ?? []}
      initialReservations={reservations ?? []}
    />
  );
}
