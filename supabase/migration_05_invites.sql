-- ============================================================================
-- ANEXO — Migration 05 : Invitations multi-utilisateurs
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- Une invitation en attente : quand quelqu'un crée un compte avec cet email,
-- il rejoint automatiquement cet établissement au lieu d'en créer un nouveau.
create table establishment_invites (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  invited_by uuid references profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (establishment_id, email)
);

alter table establishment_invites enable row level security;

-- Les membres de l'établissement peuvent créer/voir/gérer leurs invitations
create policy "members manage invites" on establishment_invites
  for all using (establishment_id = public.current_establishment_id());

-- La personne invitée (avant même d'avoir un profil) peut voir sa propre invitation
create policy "invited user can see own invite" on establishment_invites
  for select using (email = auth.jwt() ->> 'email');

-- ... et la marquer comme acceptée au moment de son inscription
create policy "invited user can accept own invite" on establishment_invites
  for update using (email = auth.jwt() ->> 'email');

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
