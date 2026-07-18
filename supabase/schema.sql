-- ============================================================================
-- ANEXO — Schéma de base de données (Supabase / PostgreSQL)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================================

create extension if not exists "pgcrypto"; -- pour gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ÉTABLISSEMENTS (un camping, un hôtel... = un tenant)
-- ----------------------------------------------------------------------------
create table establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PROFILS (étend auth.users géré par Supabase Auth)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid references establishments(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

-- Fonction utilitaire : établissement de l'utilisateur actuellement connecté
create or replace function public.current_establishment_id()
returns uuid
language sql
security definer
stable
as $$
  select establishment_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 3. ANNEXES (emplacements génériques renommables : "Annexe 1", "Annexe 2"...)
-- ----------------------------------------------------------------------------
create table annexes (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  slot_number int not null,
  label text not null default 'Nouvelle annexe',
  icon text not null default '📦',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (establishment_id, slot_number)
);

-- ----------------------------------------------------------------------------
-- 4. ARTICLES au sein d'une annexe (ex : "Vélo musculaire", "Machine à laver n°2")
-- ----------------------------------------------------------------------------
create table annexe_items (
  id uuid primary key default gen_random_uuid(),
  annexe_id uuid not null references annexes(id) on delete cascade,
  name text not null,
  stock int not null default 1,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. FORMULES TARIFAIRES par article (ex : "Jour" 10€, "Semaine" 60€)
-- ----------------------------------------------------------------------------
create table annexe_item_plans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references annexe_items(id) on delete cascade,
  label text not null,      -- "Jour", "Semaine", "Client campeur"...
  unit text not null,       -- "jour" | "semaine" | "heure" | "demi-journée" | autre
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. RÉSERVATIONS
-- ----------------------------------------------------------------------------
create table reservations (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  annexe_id uuid not null references annexes(id) on delete cascade,
  client_name text not null,
  num_people int not null default 1,
  is_family boolean not null default false,
  start_date date not null,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

-- Lignes de réservation (quel article, quelle formule, quelle quantité/durée)
create table reservation_lines (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  item_id uuid not null references annexe_items(id),
  plan_id uuid not null references annexe_item_plans(id),
  qty int not null default 1,
  duration int not null default 1,
  line_total numeric(10,2) not null
);

-- ============================================================================
-- SÉCURITÉ : Row Level Security — chaque établissement ne voit que ses données
-- ============================================================================
alter table establishments enable row level security;
alter table profiles enable row level security;
alter table annexes enable row level security;
alter table annexe_items enable row level security;
alter table annexe_item_plans enable row level security;
alter table reservations enable row level security;
alter table reservation_lines enable row level security;

create policy "own establishment" on establishments
  for select using (id = public.current_establishment_id());
create policy "insert own establishment" on establishments
  for insert with check (auth.uid() is not null);

create policy "own profile" on profiles
  for select using (establishment_id = public.current_establishment_id());
create policy "update own profile" on profiles
  for update using (id = auth.uid());
create policy "insert own profile" on profiles
  for insert with check (id = auth.uid());

create policy "tenant isolation - annexes" on annexes
  for all using (establishment_id = public.current_establishment_id());

create policy "tenant isolation - items" on annexe_items
  for all using (
    annexe_id in (select id from annexes where establishment_id = public.current_establishment_id())
  );

create policy "tenant isolation - plans" on annexe_item_plans
  for all using (
    item_id in (
      select ai.id from annexe_items ai
      join annexes a on a.id = ai.annexe_id
      where a.establishment_id = public.current_establishment_id()
    )
  );

create policy "tenant isolation - reservations" on reservations
  for all using (establishment_id = public.current_establishment_id());

create policy "tenant isolation - reservation lines" on reservation_lines
  for all using (
    reservation_id in (select id from reservations where establishment_id = public.current_establishment_id())
  );

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
