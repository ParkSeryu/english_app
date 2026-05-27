-- Compatibility marker for Supabase CLI migration history.
--
-- The dev Supabase project already records remote migration version
-- 20260504014422 with the name grant_private_expression_save_privileges_20260504.
-- The canonical idempotent grant migration lives in:
--   20260504010000_grant_private_expression_save_privileges.sql
--
-- Keep this migration as a no-op so Supabase Preview can reconcile remote
-- migration history without duplicating the canonical grant on fresh databases.

select 1;
