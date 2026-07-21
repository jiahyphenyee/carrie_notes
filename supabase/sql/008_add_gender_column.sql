-- Step 8: add a Gender field to Basic information.
-- Idempotent. No RLS changes needed -- the existing owner-scoped pets
-- policy already covers this column.

alter table public.pets add column if not exists gender text;
