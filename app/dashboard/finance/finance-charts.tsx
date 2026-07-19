"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

type Reservation = { start_date: string; total: number };

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekKey(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export default function FinanceCharts({ reservations }: { reservations: Reservation[] }) {
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    let daily = 0, weekly = 0, monthly = 0, yearly = 0;
    const wk = weekKey(today), mk = monthKey(today), yk = today.slice(0, 4);
    const byDay: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    reservations.forEach((r) => {
      const total = Number(r.total);
      if (r.start_date === today) daily += total;
      if (weekKey(r.start_date) === wk) weekly += total;
      if (monthKey(r.start_date) === mk) monthly += total;
      if (r.start_date.slice(0, 4) === yk) {
        yearly += total;
        const m = r.start_date.slice(5, 7);
        byMonth[m] = (byMonth[m] || 0) + total;
      }
      byDay[r.start_date] = (byDay[r.start_date] || 0) + total;
    });

    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      last30.push({ date: d.slice(5), value: byDay[d] || 0 });
    }
    const byMonthSeries = MONTH_LABELS.map((label, idx) => {
      const m = String(idx + 1).padStart(2, "0");
      return { month: label, value: byMonth[m] || 0 };
    });

    return { daily, weekly, monthly, yearly, year: yk, last30, byMonthSeries };
  }, [reservations, today]);

  return (
    <div>
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Aujourd'hui", value: stats.daily },
          { label: "Cette semaine", value: stats.weekly },
          { label: "Ce mois-ci", value: stats.monthly },
          { label: `Année ${stats.year}`, value: stats.yearly },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1A2B4B] rounded-xl p-5">
            <div className="text-xs text-[#AEB9CC] mb-2">{kpi.label.toUpperCase()}</div>
            <div className="font-mono text-2xl font-semibold text-white">{fmtEUR(kpi.value)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DCE3EA] rounded-xl p-5 mb-6">
        <div className="font-black text-sm text-[#1A2B4B] mb-4">CHIFFRE D&apos;AFFAIRES PAR MOIS — ANNÉE {stats.year}</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.byMonthSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5B6B80" }} />
            <YAxis tick={{ fontSize: 10, fill: "#5B6B80" }} width={40} />
            <Tooltip formatter={(v) => fmtEUR(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #DCE3EA", fontSize: 12 }} />
            <Bar dataKey="value" fill="#2473BA" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-[#DCE3EA] rounded-xl p-5">
        <div className="font-black text-sm text-[#1A2B4B] mb-4">CHIFFRE D&apos;AFFAIRES — 30 DERNIERS JOURS</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.last30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5B6B80" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "#5B6B80" }} width={40} />
            <Tooltip formatter={(v) => fmtEUR(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid #DCE3EA", fontSize: 12 }} />
            <Bar dataKey="value" fill="#FFD614" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {reservations.length === 0 && (
        <p className="text-sm text-[#5B6B80] mt-4 text-center">
          Pas encore de données — les graphiques se rempliront au fil des réservations.
        </p>
      )}
    </div>
  );
}
