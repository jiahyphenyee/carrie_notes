-- Step 6: embeddings + pgvector similarity search.
--
-- doc_chunks has had RLS enabled since Step 2 but, like documents before
-- Step 5's fix, never got an owner-scoped policy. Add it up front here
-- instead of rediscovering it via a 500. Run this in the Supabase SQL
-- editor as the project owner.
--
-- match_pet_chunks needs "extensions" in its search_path (not just
-- "public"): pgvector's <=> operator lives in the extensions schema on
-- this project, and a SECURITY DEFINER function's search_path is fixed at
-- call time regardless of the caller's session search_path.

alter table public.doc_chunks enable row level security;

drop policy if exists "Owners can manage their pets' doc chunks" on public.doc_chunks;
create policy "Owners can manage their pets' doc chunks"
on public.doc_chunks
for all
to authenticated
using (
  exists (
    select 1 from public.pets
    where pets.id = doc_chunks.pet_id
    and pets.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.pets
    where pets.id = doc_chunks.pet_id
    and pets.owner_id = auth.uid()
  )
);

-- Caregiver-facing similarity search, keyed on share_token (not a raw
-- pet_id) so it's directly callable by the anon role without exposing pet
-- ids or requiring broad public RLS -- same pattern as get_shared_pet in
-- 004_caregiver_share_function.sql.
create or replace function public.match_pet_chunks(
  p_share_token text,
  p_query_embedding vector(1536),
  p_match_count int default 6
)
returns table (
  source_type text,
  source_label text,
  content text,
  similarity float
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pet_id uuid;
begin
  select p.id into v_pet_id from pets p where p.share_token::text = p_share_token;
  if v_pet_id is null then
    return;
  end if;

  return query
  select
    dc.source_type,
    dc.source_label,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) as similarity
  from doc_chunks dc
  where dc.pet_id = v_pet_id
  order by dc.embedding <=> p_query_embedding
  limit p_match_count;
end;
$$;

revoke all on function public.match_pet_chunks(text, vector, int) from public;
grant execute on function public.match_pet_chunks(text, vector, int) to anon, authenticated;
