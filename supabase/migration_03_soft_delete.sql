-- ============================================================================
-- ANEXO — Migration 03 : Suppression sécurisée des annexes (corbeille)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- Une annexe "supprimée" n'est pas effacée immédiatement : on marque juste la
-- date de suppression. Elle disparaît de l'interface normale, mais reste
-- récupérable depuis la corbeille tant qu'elle n'a pas été effacée pour de bon.
alter table annexes add column deleted_at timestamptz;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
