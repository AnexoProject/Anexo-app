import { createClient } from "@/lib/supabase/server";
import FinanceCharts from "./finance-charts";

export default async function FinancePage() {
  const supabase = await createClient();

  // On récupère toutes les réservations (raisonnable pour un usage mono-établissement ;
  // à paginer/agréger côté base si le volume grossit beaucoup plus tard).
  const { data: reservations } = await supabase
    .from("reservations")
    .select("start_date, total")
    .order("start_date", { ascending: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-black text-xl text-[#1A2B4B]">FINANCE</h1>
        <p className="text-sm text-[#5B6B80] mt-1">Chiffre d&apos;affaires toutes annexes confondues.</p>
      </div>
      <FinanceCharts reservations={reservations ?? []} />
    </div>
  );
}
