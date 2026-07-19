"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Dot,
} from "recharts";

type Reservation = { start_date: string; total: number; annexe_label?: string; annexe_icon?: string };

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} %`;
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

const PALETTE = ["#2473BA", "#FFD614", "#1A2B4B", "#5B6B80", "#8ABEDD", "#F0C93A"];

export default function FinanceCharts({ reservations }: { reservations: Reservation[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const hasBreakdown = reservations.some((r) => r.annexe_label);

  const stats = useMemo(() => {
    let daily = 0, weekly = 0, monthly = 0, yearly = 0;
    const wk = weekKey(today), mk = monthKey(today), yk = today.slice(0, 4);
    const byDay: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const byRubrique: Record<string, { total: number; icon: string }> = {};

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
      if (r.annexe_label) {
        if (!byRubrique[r.annexe_label]) byRubrique[r.annexe_label] = { total: 0, icon: r.annexe_icon || "📦" };
        byRubrique[r.annexe_label].total += total;
      }
    });

    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      last30.push({ date: d.slice(5), value: byDay[d] || 0 });
    }
    const byMonthSeries = MONTH_LABELS.map((label, idx) => {
      const m = String(idx + 1).padStart(2, "0");
      return { month: label, value: byMonth[m] || 0 };
    }).map((point, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1].value : null;
      const pctChange = prev && prev > 0 ? ((point.value - prev) / prev) * 100 : null;
      return { ...point, pctChange };
    });

    const rubriqueBreakdown = Object.entries(byRubrique)
      .map(([label, v]) => ({ label, icon: v.icon, total: v.total }))
      .sort((a, b) => b.total - a.total);
    const rubriqueMax = Math.max(1, ...rubriqueBreakdown.map((r) => r.total));

    // Évolution du mois en cours vs mois précédent
    const now = new Date(today + "T00:00:00");
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMk = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    let prevMonthTotal = 0;
    reservations.forEach((r) => {
      if (monthKey(r.start_date) === prevMk) prevMonthTotal += Number(r.total);
    });
    const momChange = prevMonthTotal > 0 ? ((monthly - prevMonthTotal) / prevMonthTotal) * 100 : null;

    return { daily, weekly, monthly, yearly, year: yk, last30, byMonthSeries, rubriqueBreakdown, rubriqueMax, momChange, prevMonthTotal };
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
            {kpi.label === "Ce mois-ci" && stats.momChange !== null && (
              <div className={`text-xs mt-1 font-semibold ${stats.momChange >= 0 ? "text-[#7CD992]" : "text-[#F0897A]"}`}>
                {fmtPct(stats.momChange)} vs mois précédent
              </div>
            )}
          </div>
        ))}
      </div>

      {hasBreakdown && stats.rubriqueBreakdown.length > 0 && (
        <div className="bg-white border border-[#DCE3EA] rounded-xl p-5 mb-6">
          <div className="font-black text-sm text-[#1A2B4B] mb-4">CHIFFRE D&apos;AFFAIRES PAR RUBRIQUE</div>
          <div className="space-y-3">
            {stats.rubriqueBreakdown.map((r, idx) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-[#1A2B4B]"><span>{r.icon}</span>{r.label}</span>
                  <span className="font-mono">{fmtEUR(r.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F4F7FA] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(r.total / stats.rubriqueMax) * 100}%`, backgroundColor: PALETTE[idx % PALETTE.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#DCE3EA] rounded-xl p-5 mb-6">
        <div className="font-black text-sm text-[#1A2B4B] mb-1">ÉVOLUTION MENSUELLE — ANNÉE {stats.year}</div>
        <div className="text-xs text-[#5B6B80] mb-4">Survolez un point pour voir l&apos;évolution par rapport au mois précédent.</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.byMonthSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5B6B80" }} />
            <YAxis tick={{ fontSize: 10, fill: "#5B6B80" }} width={40} />
            <Tooltip content={<MonthTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#2473BA" strokeWidth={2.5} dot={{ r: 4, fill: "#2473BA" }} activeDot={{ r: 6 }} />
          </LineChart>
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

function MonthTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: { value: number; pctChange: number | null } }[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const { value, pctChange } = payload[0].payload;
  return (
    <div className="bg-white border border-[#DCE3EA] rounded-lg px-3 py-2 text-xs shadow-sm">
      <div className="font-semibold text-[#1A2B4B] mb-1">{label}</div>
      <div className="font-mono">{fmtEUR(value)}</div>
      {pctChange !== null && (
        <div className={pctChange >= 0 ? "text-[#1F8A4C]" : "text-[#C0392B]"}>{fmtPct(pctChange)} vs mois précédent</div>
      )}
    </div>
  );
}
