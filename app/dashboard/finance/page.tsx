import { createClient } from "@/lib/supabase/server";
import FinanceCharts from "./finance-charts";

export default async function FinancePage() {
  const supabase = await createClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("start_date, total, annexe_id, annexes(label, icon)")
    .order("start_date", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-black text-xl text-[#1A2B4B]">FINANCE</h1>
        <p className="text-sm text-[#5B6B80] mt-1">Chiffre d&apos;affaires toutes rubriques confondues.</p>
      </div>
      <FinanceCharts
        reservations={(reservations ?? []).map((r) => ({
          start_date: r.start_date,
          total: r.total,
          annexe_label: (r.annexes as unknown as { label: string } | null)?.label ?? "Sans rubrique",
          annexe_icon: (r.annexes as unknown as { icon: string } | null)?.icon ?? "📦",
        }))}
      />
    </div>
  );
}
