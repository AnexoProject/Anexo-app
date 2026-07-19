-- ============================================================================
-- ANEXO — Migration 02 : Équipements additionnels (casque, porte-bébé...)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- (à lancer APRÈS le schema.sql initial, sur une base qui existe déjà)
-- ============================================================================

-- Équipements proposés en plus au sein d'une annexe (tarif fixe, pas de formule)
create table annexe_equipment (
  id uuid primary key default gen_random_uuid(),
  annexe_id uuid not null references annexes(id) on delete cascade,
  name text not null,
  fee numeric(10,2) not null default 0,
  stock int not null default 999,
  created_at timestamptz not null default now()
);

-- Équipements choisis sur une réservation donnée
create table reservation_equipment_lines (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  equipment_id uuid not null references annexe_equipment(id),
  qty int not null default 1,
  line_total numeric(10,2) not null
);

alter table annexe_equipment enable row level security;
alter table reservation_equipment_lines enable row level security;

create policy "tenant isolation - equipment" on annexe_equipment
  for all using (
    annexe_id in (select id from annexes where establishment_id = public.current_establishment_id())
  );

create policy "tenant isolation - reservation equipment lines" on reservation_equipment_lines
  for all using (
    reservation_id in (select id from reservations where establishment_id = public.current_establishment_id())
  );

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
