-- Step 5: owner-scoped RLS for the persisted document library.
--
-- Uploads were failing with "new row violates row-level security policy"
-- because the documents table and/or the pet-documents storage bucket never
-- got an owner-scoped policy (only pets/care_details/vaccinations did, in
-- Step 2). Run this in the Supabase SQL editor as the project owner.
-- Both statements are idempotent (drop-if-exists then create) so it's safe
-- to re-run even if one of the two already had a policy.

alter table public.documents enable row level security;

drop policy if exists "Owners can manage their pets' documents" on public.documents;
create policy "Owners can manage their pets' documents"
on public.documents
for all
to authenticated
using (
  exists (
    select 1 from public.pets
    where pets.id = documents.pet_id
    and pets.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.pets
    where pets.id = documents.pet_id
    and pets.owner_id = auth.uid()
  )
);

-- Storage objects are stored at "<pet_id>/<document_id>-<filename>", so the
-- first path segment (storage.foldername(storage.objects.name))[1]
-- identifies the pet. The reference must be qualified as storage.objects.name
-- -- pets also has its own "name" column, and inside the EXISTS subquery an
-- unqualified "name" resolves to pets.name instead of the outer object path.
drop policy if exists "Owners can manage their pets' document files" on storage.objects;
create policy "Owners can manage their pets' document files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'pet-documents'
  and exists (
    select 1 from public.pets
    where pets.id::text = (storage.foldername(storage.objects.name))[1]
    and pets.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'pet-documents'
  and exists (
    select 1 from public.pets
    where pets.id::text = (storage.foldername(storage.objects.name))[1]
    and pets.owner_id = auth.uid()
  )
);
