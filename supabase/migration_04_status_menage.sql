-- ============================================================================
-- ANEXO — Migration 04 : Statut & commentaire des réservations + Ménage
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- --- Réservations : statut (active / terminée) et commentaire libre ---------
alter table reservations add column status text not null default 'active' check (status in ('active', 'terminee'));
alter table reservations add column comment text;

-- --- Ménage : salariés ------------------------------------------------------
create table staff_members (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- --- Ménage : tâches planifiées ---------------------------------------------
create table cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  location_label text not null,          -- ex : "Mobil-home 12", "Sanitaire"
  task_date date not null,
  start_time time not null,
  duration_minutes int not null default 30,
  staff_id uuid references staff_members(id) on delete set null,
  notes text,
  status text not null default 'a_faire' check (status in ('a_faire', 'fait')),
  created_at timestamptz not null default now()
);

alter table staff_members enable row level security;
alter table cleaning_tasks enable row level security;

create policy "tenant isolation - staff" on staff_members
  for all using (establishment_id = public.current_establishment_id());

create policy "tenant isolation - cleaning tasks" on cleaning_tasks
  for all using (establishment_id = public.current_establishment_id());

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
