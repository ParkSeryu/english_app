-- Compatibility marker for Supabase CLI migration history.
--
-- The dev Supabase project already records remote migration version
-- 20260504014420 with the name personal_expressions_memorization_20260502.
-- The canonical idempotent schema changes live in:
--   20260502090000_personal_expressions_memorization.sql
--
-- Keep this migration as a no-op so Supabase Preview can reconcile remote
-- migration history without duplicating the canonical DDL on fresh databases.

select 1;
