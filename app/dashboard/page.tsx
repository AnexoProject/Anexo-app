import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function HomeDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const { data: reservationsToday } = await supabase
    .from("reservations")
    .select("*, annexes(label, icon)")
    .eq("start_date", today)
    .order("created_at", { ascending: false });

  const { data: reservationsWeek } = await supabase
    .from("reservations")
    .select("total")
    .gte("start_date", weekAgo);

  const { data: annexes } = await supabase
    .from("annexes")
    .select("id, label, icon")
    .is("deleted_at", null)
    .order("slot_number");

  const caToday = (reservationsToday ?? []).reduce((sum, r) => sum + Number(r.total), 0);
  const caWeek = (reservationsWeek ?? []).reduce((sum, r) => sum + Number(r.total), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-black text-xl text-[#1A2B4B]">TABLEAU DE BORD</h1>
        <p className="text-sm text-[#5B6B80] mt-1 capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A2B4B] rounded-xl p-5">
          <div className="text-xs text-[#AEB9CC] mb-2">RÉSERVATIONS AUJOURD&apos;HUI</div>
          <div className="font-mono text-2xl font-semibold text-white">{reservationsToday?.length ?? 0}</div>
        </div>
        <div className="bg-[#1A2B4B] rounded-xl p-5">
          <div className="text-xs text-[#AEB9CC] mb-2">CA DU JOUR</div>
          <div className="font-mono text-2xl font-semibold text-white">{fmtEUR(caToday)}</div>
        </div>
        <div className="bg-[#1A2B4B] rounded-xl p-5">
          <div className="text-xs text-[#AEB9CC] mb-2">CA DES 7 DERNIERS JOURS</div>
          <div className="font-mono text-2xl font-semibold text-white">{fmtEUR(caWeek)}</div>
        </div>
        <Link href="/dashboard/finance" className="bg-white border border-[#DCE3EA] rounded-xl p-5 flex flex-col justify-between hover:border-[#2473BA] transition-colors">
          <div className="text-xs text-[#5B6B80] mb-2">VOIR PLUS</div>
          <div className="font-semibold text-[#2473BA] text-sm">Détails financiers →</div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="font-black text-xs text-[#5B6B80] mb-3">RÉSERVATIONS DU JOUR</div>
            <div className="space-y-2">
              {(!reservationsToday || reservationsToday.length === 0) && (
                <div className="bg-white border border-[#DCE3EA] rounded-xl p-6 text-center text-sm text-[#5B6B80]">
                  Aucune réservation aujourd&apos;hui.
                </div>
              )}
              {reservationsToday?.map((r) => (
                <div key={r.id} className="bg-white border border-[#DCE3EA] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{(r.annexes as unknown as { icon: string } | null)?.icon ?? "📦"}</span>
                    <div>
                      <div className="font-semibold text-sm text-[#1A2B4B]">{r.client_name}</div>
                      <div className="text-xs text-[#5B6B80]">{(r.annexes as unknown as { label: string } | null)?.label} · {r.num_people} pers.</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm">{fmtEUR(Number(r.total))}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-black text-xs text-[#5B6B80] mb-3">TÂCHES À VENIR — LOCATIONS &amp; MÉNAGE</div>
            <div className="bg-white border border-dashed border-[#DCE3EA] rounded-xl p-6 text-center text-sm text-[#5B6B80]">
              Le planning des tâches (ménages, entretien, préparation des locations) arrive dans une prochaine version.
            </div>
          </div>
        </div>

        {/* Barre latérale : accès rapide aux annexes */}
        <div>
          <div className="font-black text-xs text-[#5B6B80] mb-3">ANNEXES</div>
          <div className="space-y-2">
            {annexes?.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/annexe/${a.id}`}
                className="bg-white border border-[#DCE3EA] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#2473BA] transition-colors"
              >
                <span className="text-lg">{a.icon}</span>
                <span className="text-sm font-semibold text-[#1A2B4B]">{a.label}</span>
              </Link>
            ))}
            <Link
              href="/dashboard/annexes"
              className="border-2 border-dashed border-[#DCE3EA] rounded-xl px-4 py-3 flex items-center justify-center text-sm font-semibold text-[#5B6B80] hover:border-[#2473BA] hover:text-[#2473BA]"
            >
              Gérer les annexes →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
