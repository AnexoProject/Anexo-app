"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FinanceCharts from "../../finance/finance-charts";

type Plan = { id: string; item_id: string; label: string; unit: string; price: number };
type Item = { id: string; annexe_id: string; name: string; stock: number; annexe_item_plans: Plan[] };
type Equipment = { id: string; annexe_id: string; name: string; fee: number; stock: number };
type ReservationLine = {
  id: string;
  qty: number;
  duration: number;
  line_total: number;
  annexe_items: { name: string } | null;
  annexe_item_plans: { label: string; unit: string } | null;
};
type ReservationEquipmentLine = {
  id: string;
  qty: number;
  line_total: number;
  annexe_equipment: { name: string } | null;
};
type Reservation = {
  id: string;
  client_name: string;
  num_people: number;
  start_date: string;
  total: number;
  reservation_lines: ReservationLine[];
  reservation_equipment_lines: ReservationEquipmentLine[];
};
type Annexe = { id: string; label: string; icon: string; slot_number: number };

function fmtEUR(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default function AnnexeManager({
  annexe,
  initialItems,
  initialEquipment,
  initialReservations,
}: {
  annexe: Annexe;
  initialItems: Item[];
  initialEquipment: Equipment[];
  initialReservations: Reservation[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [reservations] = useState(initialReservations);
  const [tab, setTab] = useState<"items" | "reservations" | "finance">("reservations");

  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState(1);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const { data, error } = await supabase
      .from("annexe_items")
      .insert({ annexe_id: annexe.id, name: newItemName.trim(), stock: newItemStock })
      .select("*, annexe_item_plans(*)")
      .single();
    if (!error && data) {
      setItems((it) => [...it, data]);
      setNewItemName("");
      setNewItemStock(1);
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("annexe_items").delete().eq("id", id);
    setItems((it) => it.filter((i) => i.id !== id));
  }

  async function addPlan(itemId: string, label: string, unit: string, price: number) {
    const { data, error } = await supabase
      .from("annexe_item_plans")
      .insert({ item_id: itemId, label, unit, price })
      .select()
      .single();
    if (!error && data) {
      setItems((it) => it.map((i) => (i.id === itemId ? { ...i, annexe_item_plans: [...i.annexe_item_plans, data] } : i)));
    }
  }

  async function deletePlan(itemId: string, planId: string) {
    await supabase.from("annexe_item_plans").delete().eq("id", planId);
    setItems((it) =>
      it.map((i) => (i.id === itemId ? { ...i, annexe_item_plans: i.annexe_item_plans.filter((p) => p.id !== planId) } : i))
    );
  }

  async function addEquipment(name: string, fee: number) {
    const { data, error } = await supabase
      .from("annexe_equipment")
      .insert({ annexe_id: annexe.id, name, fee })
      .select()
      .single();
    if (!error && data) setEquipment((eq) => [...eq, data]);
  }

  async function deleteEquipment(id: string) {
    await supabase.from("annexe_equipment").delete().eq("id", id);
    setEquipment((eq) => eq.filter((e) => e.id !== id));
  }

  return (
    <div>
      <Link href="/dashboard/annexes" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6B80] hover:text-[#2473BA] mb-4">
        ← Toutes les rubriques
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{annexe.icon}</span>
        <div>
          <div className="text-xs text-[#5B6B80] font-mono">Rubrique {annexe.slot_number}</div>
          <h1 className="font-black text-xl text-[#1A2B4B]">{annexe.label.toUpperCase()}</h1>
        </div>
      </div>

      <nav className="flex gap-1 p-1 rounded-xl bg-white border border-[#DCE3EA] w-fit mb-6">
        <button
          onClick={() => setTab("reservations")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === "reservations" ? "bg-[#1A2B4B] text-white" : "text-[#5B6B80]"}`}
        >
          Réservations
        </button>
        <button
          onClick={() => setTab("items")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === "items" ? "bg-[#1A2B4B] text-white" : "text-[#5B6B80]"}`}
        >
          Articles &amp; tarifs
        </button>
        <button
          onClick={() => setTab("finance")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === "finance" ? "bg-[#1A2B4B] text-white" : "text-[#5B6B80]"}`}
        >
          Finance
        </button>
      </nav>

      {tab === "items" && (
        <div className="space-y-8">
          <div>
            <div className="font-black text-xs text-[#5B6B80] mb-3">ARTICLES</div>
            <div className="space-y-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onDeleteItem={deleteItem} onAddPlan={addPlan} onDeletePlan={deletePlan} />
              ))}

              <form onSubmit={addItem} className="bg-white border border-dashed border-[#DCE3EA] rounded-xl p-4 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Nouvel article</label>
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex : Vélo musculaire"
                    className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Stock</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
                  />
                </div>
                <button type="submit" className="bg-[#2473BA] text-white text-sm font-semibold rounded-lg px-4 py-2">
                  Ajouter
                </button>
              </form>
            </div>
          </div>

          <div>
            <div className="font-black text-xs text-[#5B6B80] mb-3">ÉQUIPEMENTS EN PLUS</div>
            <EquipmentSection equipment={equipment} onAdd={addEquipment} onDelete={deleteEquipment} />
          </div>
        </div>
      )}

      {tab === "reservations" && (
        <ReservationsPanel
          annexeId={annexe.id}
          items={items}
          equipment={equipment}
          reservations={reservations}
          onCreated={() => router.refresh()}
        />
      )}

      {tab === "finance" && (
        <FinanceCharts reservations={reservations.map((r) => ({ start_date: r.start_date, total: r.total }))} />
      )}
    </div>
  );
}

function EquipmentSection({
  equipment,
  onAdd,
  onDelete,
}: {
  equipment: Equipment[];
  onAdd: (name: string, fee: number) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [fee, setFee] = useState(2);

  return (
    <div className="space-y-2">
      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {equipment.map((eq) => (
            <span key={eq.id} className="text-xs bg-[#FFF6CC] text-[#8A6A18] px-2.5 py-1.5 rounded-lg flex items-center gap-2">
              {eq.name} — {fmtEUR(eq.fee)}
              <button onClick={() => onDelete(eq.id)} className="text-[#8A6A18]/60 hover:text-[#C0392B]">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="bg-white border border-dashed border-[#DCE3EA] rounded-xl p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Nouvel équipement</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Casque, Porte-bébé, Panier"
            className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Prix (€)</label>
          <input
            type="number"
            min={0}
            step="0.5"
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]"
          />
        </div>
        <button
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name.trim(), fee);
            setName("");
            setFee(2);
          }}
          className="bg-[#2473BA] text-white text-sm font-semibold rounded-lg px-4 py-2"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onDeleteItem,
  onAddPlan,
  onDeletePlan,
}: {
  item: Item;
  onDeleteItem: (id: string) => void;
  onAddPlan: (itemId: string, label: string, unit: string, price: number) => void;
  onDeletePlan: (itemId: string, planId: string) => void;
}) {
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [label, setLabel] = useState("Jour");
  const [unit, setUnit] = useState("jour");
  const [price, setPrice] = useState(10);

  return (
    <div className="bg-white border border-[#DCE3EA] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-[#1A2B4B]">{item.name}</div>
          <div className="text-xs text-[#5B6B80]">Stock : {item.stock}</div>
        </div>
        <button onClick={() => onDeleteItem(item.id)} className="text-xs text-[#C0392B]">
          Supprimer
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {item.annexe_item_plans.map((plan) => (
          <span
            key={plan.id}
            className="text-xs bg-[#E4EFF9] text-[#2473BA] px-2.5 py-1.5 rounded-lg flex items-center gap-2"
          >
            {plan.label} — {fmtEUR(plan.price)}/{plan.unit}
            <button onClick={() => onDeletePlan(item.id, plan.id)} className="text-[#2473BA]/60 hover:text-[#C0392B]">
              ✕
            </button>
          </span>
        ))}
        {item.annexe_item_plans.length === 0 && (
          <span className="text-xs text-[#5B6B80] italic">Aucun tarif — ajoutez-en un pour pouvoir réserver cet article.</span>
        )}
      </div>

      {showAddPlan ? (
        <div className="flex flex-wrap gap-2 items-end bg-[#F4F7FA] p-3 rounded-lg">
          <div>
            <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1">Libellé</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-28 px-2 py-1.5 border border-[#DCE3EA] rounded text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1">Unité</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="px-2 py-1.5 border border-[#DCE3EA] rounded text-sm">
              <option value="jour">jour</option>
              <option value="semaine">semaine</option>
              <option value="heure">heure</option>
              <option value="demi-journée">demi-journée</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#5B6B80] mb-1">Prix (€)</label>
            <input type="number" min={0} step="0.5" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-20 px-2 py-1.5 border border-[#DCE3EA] rounded text-sm" />
          </div>
          <button
            onClick={() => {
              onAddPlan(item.id, label, unit, price);
              setShowAddPlan(false);
            }}
            className="bg-[#2473BA] text-white text-xs font-semibold rounded px-3 py-2"
          >
            OK
          </button>
          <button onClick={() => setShowAddPlan(false)} className="text-xs text-[#5B6B80] px-2">Annuler</button>
        </div>
      ) : (
        <button onClick={() => setShowAddPlan(true)} className="text-xs font-semibold text-[#2473BA]">
          + Ajouter une formule tarifaire
        </button>
      )}
    </div>
  );
}

function ReservationsPanel({
  annexeId,
  items,
  equipment,
  reservations,
  onCreated,
}: {
  annexeId: string;
  items: Item[];
  equipment: Equipment[];
  reservations: Reservation[];
  onCreated: () => void;
}) {
  const supabase = createClient();
  const [clientName, setClientName] = useState("");
  const [numPeople, setNumPeople] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [cart, setCart] = useState<{ itemId: string; planId: string; qty: number; duration: number }[]>([]);
  const [equipmentQty, setEquipmentQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [localReservations, setLocalReservations] = useState(reservations);

  function addLine() {
    const firstItem = items[0];
    if (!firstItem || !firstItem.annexe_item_plans[0]) return;
    setCart((c) => [...c, { itemId: firstItem.id, planId: firstItem.annexe_item_plans[0].id, qty: 1, duration: 1 }]);
  }
  function updateLine(idx: number, patch: Partial<{ itemId: string; planId: string; qty: number; duration: number }>) {
    setCart((c) => c.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function removeLine(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx));
  }

  function planFor(itemId: string, planId: string) {
    const item = items.find((i) => i.id === itemId);
    return item?.annexe_item_plans.find((p) => p.id === planId) || null;
  }

  const itemsTotal = cart.reduce((sum, line) => {
    const plan = planFor(line.itemId, line.planId);
    return sum + (plan ? plan.price * line.qty * line.duration : 0);
  }, 0);
  const equipmentTotal = Object.entries(equipmentQty).reduce((sum, [eqId, qty]) => {
    const eq = equipment.find((e) => e.id === eqId);
    return sum + (eq ? eq.fee * qty : 0);
  }, 0);
  const total = itemsTotal + equipmentTotal;

  async function submitReservation() {
    setError("");
    if (!clientName.trim()) return setError("Indique le nom du client.");
    if (cart.length === 0) return setError("Ajoute au moins un article à la réservation.");

    setSaving(true);
    const { data: annexeRow } = await supabase.from("annexes").select("establishment_id").eq("id", annexeId).single();

    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .insert({
        establishment_id: annexeRow?.establishment_id,
        annexe_id: annexeId,
        client_name: clientName.trim(),
        num_people: numPeople,
        start_date: startDate,
        total,
      })
      .select()
      .single();

    if (resError || !reservation) {
      setError("Erreur lors de la création : " + resError?.message);
      setSaving(false);
      return;
    }

    const lines = cart.map((line) => {
      const plan = planFor(line.itemId, line.planId)!;
      return {
        reservation_id: reservation.id,
        item_id: line.itemId,
        plan_id: line.planId,
        qty: line.qty,
        duration: line.duration,
        line_total: plan.price * line.qty * line.duration,
      };
    });
    const { error: linesError } = await supabase.from("reservation_lines").insert(lines);

    const equipLines = Object.entries(equipmentQty)
      .filter(([, qty]) => qty > 0)
      .map(([eqId, qty]) => {
        const eq = equipment.find((e) => e.id === eqId)!;
        return { reservation_id: reservation.id, equipment_id: eqId, qty, line_total: eq.fee * qty };
      });
    if (equipLines.length > 0) {
      await supabase.from("reservation_equipment_lines").insert(equipLines);
    }

    setSaving(false);

    if (linesError) {
      setError("Réservation créée, mais erreur sur le détail : " + linesError.message);
      return;
    }

    setLocalReservations((r) => [
      {
        ...reservation,
        reservation_lines: lines.map((l) => ({
          ...l,
          id: crypto.randomUUID(),
          annexe_items: { name: items.find((i) => i.id === l.item_id)?.name ?? "" },
          annexe_item_plans: {
            label: planFor(l.item_id, l.plan_id)?.label ?? "",
            unit: planFor(l.item_id, l.plan_id)?.unit ?? "",
          },
        })),
        reservation_equipment_lines: equipLines.map((l) => ({
          ...l,
          id: crypto.randomUUID(),
          annexe_equipment: { name: equipment.find((e) => e.id === l.equipment_id)?.name ?? "" },
        })),
      },
      ...r,
    ]);
    setClientName("");
    setCart([]);
    setEquipmentQty({});
    onCreated();
  }

  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);

  async function deleteReservation(id: string) {
    await supabase.from("reservations").delete().eq("id", id);
    setLocalReservations((r) => r.filter((x) => x.id !== id));
  }

  async function updateReservation(id: string, patch: { client_name: string; num_people: number; start_date: string }) {
    await supabase.from("reservations").update(patch).eq("id", id);
    setLocalReservations((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setEditingReservationId(null);
  }

  return (
    <div className="grid md:grid-cols-5 gap-6">
      <div className="md:col-span-2 bg-white border border-[#DCE3EA] rounded-xl p-5 h-fit">
        <div className="font-black text-sm text-[#1A2B4B] mb-4">NOUVELLE RÉSERVATION</div>

        <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Nom du client</label>
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full mb-3 px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" placeholder="Ex : Famille Dupont" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5B6B80] mb-1">Personnes</label>
            <input type="number" min={1} value={numPeople} onChange={(e) => setNumPeople(Number(e.target.value))} className="w-full px-3 py-2 border border-[#DCE3EA] rounded-lg text-sm outline-none focus:border-[#2473BA]" />
          </div>
        </div>

        <div className="text-xs font-semibold text-[#5B6B80] mb-2">ARTICLES</div>
        <div className="space-y-2 mb-3">
          {cart.map((line, idx) => {
            const item = items.find((i) => i.id === line.itemId);
            const plan = planFor(line.itemId, line.planId);
            return (
              <div key={idx} className="bg-[#F4F7FA] rounded-lg p-2.5 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={line.itemId}
                    onChange={(e) => {
                      const newItem = items.find((i) => i.id === e.target.value);
                      updateLine(idx, { itemId: e.target.value, planId: newItem?.annexe_item_plans[0]?.id ?? "" });
                    }}
                    className="flex-1 px-2 py-1.5 border border-[#DCE3EA] rounded text-xs"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removeLine(idx)} className="text-[#C0392B] text-xs px-1">✕</button>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#5B6B80] mb-1">Formule tarifaire</label>
                  <select
                    value={line.planId}
                    onChange={(e) => updateLine(idx, { planId: e.target.value })}
                    className="w-full px-2 py-1.5 border border-[#DCE3EA] rounded text-xs"
                  >
                    {item?.annexe_item_plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.label} — {fmtEUR(p.price)}/{p.unit}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#5B6B80] mb-1">Quantité</label>
                    <input type="number" min={1} value={line.qty} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-[#DCE3EA] rounded text-xs text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#5B6B80] mb-1">
                      Durée {plan ? `(${plan.unit}${line.duration > 1 ? "s" : ""})` : ""}
                    </label>
                    <input type="number" min={1} value={line.duration} onChange={(e) => updateLine(idx, { duration: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-[#DCE3EA] rounded text-xs text-center" />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={addLine} disabled={items.length === 0} className="text-xs font-semibold text-[#2473BA] disabled:opacity-40">
            + Ajouter un article {items.length === 0 && "(créez d'abord un article dans l'onglet Articles)"}
          </button>
        </div>

        {equipment.length > 0 && (
          <>
            <div className="text-xs font-semibold text-[#5B6B80] mb-2 mt-4">ÉQUIPEMENTS EN PLUS</div>
            <div className="space-y-1.5 mb-3">
              {equipment.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#FFF6CC]">
                  <span className="text-xs text-[#8A6A18]">{eq.name} <span className="opacity-70">({fmtEUR(eq.fee)})</span></span>
                  <input
                    type="number"
                    min={0}
                    value={equipmentQty[eq.id] || 0}
                    onChange={(e) => setEquipmentQty((q) => ({ ...q, [eq.id]: Math.max(0, Number(e.target.value)) }))}
                    className="w-14 px-2 py-1 border border-[#DCE3EA] rounded text-xs text-center bg-white"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {error && <div className="text-sm text-[#C0392B] bg-[#FBE1DC] rounded-lg px-3 py-2 mb-3">{error}</div>}

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-[#5B6B80]">Total</span>
          <span className="font-mono text-lg font-semibold">{fmtEUR(total)}</span>
        </div>

        <button onClick={submitReservation} disabled={saving} className="w-full bg-[#2473BA] text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50">
          {saving ? "Enregistrement..." : "Enregistrer la réservation"}
        </button>
      </div>

      <div className="md:col-span-3 space-y-6">
        <WeekAheadView reservations={localReservations} />

        <div className="space-y-3">
        <div className="font-black text-sm text-[#1A2B4B]">RÉSERVATIONS ({localReservations.length})</div>
        {localReservations.length === 0 && (
          <div className="bg-white border border-[#DCE3EA] rounded-xl p-6 text-center text-sm text-[#5B6B80]">
            Aucune réservation pour le moment.
          </div>
        )}
        {localReservations.map((r) =>
          editingReservationId === r.id ? (
            <ReservationEditCard
              key={r.id}
              reservation={r}
              onSave={(patch) => updateReservation(r.id, patch)}
              onCancel={() => setEditingReservationId(null)}
            />
          ) : (
            <div key={r.id} className="bg-white border border-[#DCE3EA] rounded-xl p-4 group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-sm text-[#1A2B4B]">{r.client_name}</div>
                  <div className="text-xs text-[#5B6B80]">{r.start_date} · {r.num_people} pers.</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm">{fmtEUR(r.total)}</div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    <button onClick={() => setEditingReservationId(r.id)} className="text-xs text-[#5B6B80] hover:text-[#2473BA]">
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la réservation de ${r.client_name} ?`)) deleteReservation(r.id);
                      }}
                      className="text-xs text-[#5B6B80] hover:text-[#C0392B]"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.reservation_lines.map((line) => (
                  <span key={line.id} className="text-xs bg-[#F4F7FA] px-2 py-1 rounded">
                    {line.qty}× {line.annexe_items?.name} · {line.duration} {line.annexe_item_plans?.unit}
                  </span>
                ))}
                {r.reservation_equipment_lines?.map((line) => (
                  <span key={line.id} className="text-xs bg-[#FFF6CC] text-[#8A6A18] px-2 py-1 rounded">
                    {line.qty}× {line.annexe_equipment?.name}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
}

function WeekAheadView({ reservations }: { reservations: Reservation[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div>
      <div className="font-black text-xs text-[#5B6B80] mb-3">7 PROCHAINS JOURS</div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayReservations = reservations.filter((r) => r.start_date === day);
          const d = new Date(day + "T00:00:00");
          const isToday = day === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={day}
              className={`rounded-lg p-2 min-h-[90px] border ${isToday ? "border-[#2473BA] bg-[#E4EFF9]" : "border-[#DCE3EA] bg-white"}`}
            >
              <div className="text-[10px] font-semibold text-[#5B6B80] mb-1">
                {DAY_LABELS[d.getDay()]} {d.getDate()}
              </div>
              <div className="space-y-1">
                {dayReservations.slice(0, 3).map((r) => (
                  <div key={r.id} className="text-[10px] bg-[#F4F7FA] rounded px-1.5 py-1 truncate" title={r.client_name}>
                    {r.client_name}
                  </div>
                ))}
                {dayReservations.length > 3 && (
                  <div className="text-[10px] text-[#5B6B80]">+{dayReservations.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReservationEditCard({
  reservation,
  onSave,
  onCancel,
}: {
  reservation: Reservation;
  onSave: (patch: { client_name: string; num_people: number; start_date: string }) => void;
  onCancel: () => void;
}) {
  const [clientName, setClientName] = useState(reservation.client_name);
  const [numPeople, setNumPeople] = useState(reservation.num_people);
  const [startDate, setStartDate] = useState(reservation.start_date);

  return (
    <div className="bg-white border-2 border-[#2473BA] rounded-xl p-4">
      <div className="text-xs font-semibold text-[#5B6B80] mb-2">
        Modifier la réservation <span className="italic">(les articles ne sont pas modifiables ici — supprimez et recréez si besoin)</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="px-2 py-1.5 border border-[#DCE3EA] rounded text-sm col-span-1" placeholder="Client" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1.5 border border-[#DCE3EA] rounded text-sm" />
        <input type="number" min={1} value={numPeople} onChange={(e) => setNumPeople(Number(e.target.value))} className="px-2 py-1.5 border border-[#DCE3EA] rounded text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ client_name: clientName.trim() || reservation.client_name, num_people: numPeople, start_date: startDate })}
          className="flex-1 bg-[#2473BA] text-white text-xs font-semibold rounded-lg py-2"
        >
          Enregistrer
        </button>
        <button onClick={onCancel} className="px-3 text-xs text-[#5B6B80]">
          Annuler
        </button>
      </div>
    </div>
  );
}
