"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Staff = { id: string; name: string; active: boolean };
type Task = {
  id: string;
  location_label: string;
  task_date: string;
  start_time: string;
  duration_minutes: number;
  staff_id: string | null;
  notes: string | null;
  status: "a_faire" | "fait";
  staff_members: { name: string } | null;
};

const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function MenageManager({ initialStaff, initialTasks }: { initialStaff: Staff[]; initialTasks: Task[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [tasks, setTasks] = useState(initialTasks);
  const [showStaffPanel, setShowStaffPanel] = useState(false);

  const [form, setForm] = useState({
    location_label: "",
    task_date: new Date().toISOString().slice(0, 10),
    start_time: "09:00",
    duration_minutes: 30,
    staff_id: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addStaff(name: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: profile } = await supabase.from("profiles").select("establishment_id").eq("id", userData.user.id).single();
    if (!profile) return;
    const { data, error } = await supabase
      .from("staff_members")
      .insert({ establishment_id: profile.establishment_id, name })
      .select()
      .single();
    if (!error && data) setStaff((s) => [...s, data]);
  }

  async function removeStaff(id: string) {
    await supabase.from("staff_members").delete().eq("id", id);
    setStaff((s) => s.filter((x) => x.id !== id));
    setTasks((t) => t.map((task) => (task.staff_id === id ? { ...task, staff_id: null, staff_members: null } : task)));
  }

  async function submitTask() {
    setError("");
    if (!form.location_label.trim()) return setError("Indique le numéro de la location (ou \"Sanitaire\").");
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("establishment_id")
      .eq("id", userData.user!.id)
      .single();

    const { data: task, error: taskError } = await supabase
      .from("cleaning_tasks")
      .insert({
        establishment_id: profile?.establishment_id,
        location_label: form.location_label.trim(),
        task_date: form.task_date,
        start_time: form.start_time,
        duration_minutes: form.duration_minutes,
        staff_id: form.staff_id || null,
        notes: form.notes.trim() || null,
      })
      .select("*, staff_members(name)")
      .single();

    setSaving(false);
    if (taskError || !task) {
      setError("Erreur : " + taskError?.message);
      return;
    }
    setTasks((t) => [...t, task].sort((a, b) => (a.task_date + a.start_time).localeCompare(b.task_date + b.start_time)));
    setForm((f) => ({ ...f, location_label: "", notes: "" }));
    router.refresh();
  }

  async function toggleTaskStatus(id: string, current: "a_faire" | "fait") {
    const next = current === "a_faire" ? "fait" : "a_faire";
    await supabase.from("cleaning_tasks").update({ status: next }).eq("id", id);
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, status: next } : x)));
  }

  async function deleteTask(id: string) {
    await supabase.from("cleaning_tasks").delete().eq("id", id);
    setTasks((t) => t.filter((x) => x.id !== id));
  }

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-black text-xl text-[#1A2B4B]">MÉNAGE</h1>
          <p className="text-sm text-[#5B6B80] mt-1">Planning des tâches de ménage et d&apos;entretien.</p>
        </div>
        <button
          onClick={() => setShowStaffPanel((s) => !s)}
          className="text-xs font-semibold text-[#5B6B80] hover:text-[#2473BA] bg-white border border-[#DCE3EA] rounded-lg px-3 py-2"
        >
          👥 Salariés ménage ({staff.filter((s) => s.active).length})
        </button>
      </div>

      {showStaffPanel && (
        <div className="bg-white border border-[#DCE3EA] rounded-xl p-4 mb-6">
          <div className="font-black text-xs text-[#5B6B80] mb-3">SALARIÉS MÉNAGE</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {staff.map((s) => (
              <span key={s.id} className="text-sm bg-[#F4F7FA] px-3 py-1.5 rounded-lg flex items-center gap-2">
                {s.name}
                <button onClick={() => removeStaff(s.id)} className="text-[#5B6B80] hover:text-[#C0392B]">✕</button>
              </span>
            ))}
            {staff.length === 0 && <span className="text-sm text-[#5B6B80]">Aucun salarié pour l&apos;instant.</span>}
          </div>
          <NewStaffForm onAdd={addStaff} />
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 bg-white border border-[#DCE3EA] rounded-xl p-5 h-fit">
          <div className="font-black text-sm text-[#1A2B4B] mb-4">NOUVELLE TÂCHE</div>

          <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Numéro de location / lieu</label>
          <input
            value={form.location_label}
            onChange={(e) => setForm((f) => ({ ...f, location_label: e.target.value }))}
            placeholder="Ex : Mobil-home 12, Sanitaire"
            className="w-full mb-3 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Date</label>
              <input type="date" value={form.task_date} onChange={(e) => setForm((f) => ({ ...f, task_date: e.target.value }))} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Heure</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Durée (minutes)</label>
              <input type="number" min={5} step={5} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Assigné à</label>
              <select value={form.staff_id} onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]">
                <option value="">Non assigné</option>
                {staff.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Notes (facultatif)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full mb-3 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA] resize-none"
          />

          {error && <div className="text-sm text-[#C0392B] bg-[#FBE1DC] rounded-lg px-3 py-2 mb-3">{error}</div>}

          <button onClick={submitTask} disabled={saving} className="w-full bg-[#2473BA] text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Ajouter la tâche"}
          </button>
        </div>

        <div className="md:col-span-3 space-y-4">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => t.task_date === day);
            if (dayTasks.length === 0) return null;
            const d = new Date(day + "T00:00:00");
            const isToday = day === new Date().toISOString().slice(0, 10);
            return (
              <div key={day}>
                <div className={`text-xs font-black mb-2 ${isToday ? "text-[#2473BA]" : "text-[#5B6B80]"}`}>
                  {DAY_LABELS[d.getDay()].toUpperCase()} {d.getDate()}/{d.getMonth() + 1} {isToday && "· AUJOURD'HUI"}
                </div>
                <div className="space-y-2">
                  {dayTasks.map((t) => (
                    <div key={t.id} className={`bg-white border rounded-xl p-3 flex items-center justify-between group ${t.status === "fait" ? "opacity-50 border-[#DCE3EA]" : "border-[#DCE3EA]"}`}>
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs text-[#5B6B80] w-12">{t.start_time.slice(0, 5)}</div>
                        <div>
                          <div className="text-sm font-semibold text-[#1A2B4B]">{t.location_label}</div>
                          <div className="text-xs text-[#5B6B80]">
                            {t.duration_minutes} min · {t.staff_members?.name ?? "Non assigné"}
                          </div>
                          {t.notes && <div className="text-xs text-[#5B6B80] italic mt-0.5">{t.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => toggleTaskStatus(t.id, t.status)} className="text-xs" title={t.status === "a_faire" ? "Marquer comme fait" : "Réactiver"}>
                          {t.status === "a_faire" ? "✅" : "↺"}
                        </button>
                        <button onClick={() => deleteTask(t.id)} className="text-xs text-[#5B6B80] hover:text-[#C0392B]">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="bg-white border border-[#DCE3EA] rounded-xl p-6 text-center text-sm text-[#5B6B80]">
              Aucune tâche planifiée sur les 14 prochains jours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewStaffForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du salarié"
        className="flex-1 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
      />
      <button
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name.trim());
          setName("");
        }}
        className="bg-[#2473BA] text-white text-sm font-semibold rounded-lg px-4 py-2"
      >
        Ajouter
      </button>
    </div>
  );
}
