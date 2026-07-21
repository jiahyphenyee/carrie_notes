-- Step 7: caregiver chat history.
--
-- chat_sessions/chat_messages have had RLS enabled since Step 2 but, like
-- every other table so far, never got policies. Owners get read-only
-- access (they can view history but never write to it -- only the
-- caregiver-facing function below does); caregivers write through
-- send_chat_message, the same SECURITY DEFINER + share_token pattern as
-- get_shared_pet and match_pet_chunks. Run this in the Supabase SQL editor
-- as the project owner.

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Owners can view their pets' chat sessions" on public.chat_sessions;
create policy "Owners can view their pets' chat sessions"
on public.chat_sessions
for select
to authenticated
using (
  exists (
    select 1 from public.pets
    where pets.id = chat_sessions.pet_id
    and pets.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can view their pets' chat messages" on public.chat_messages;
create policy "Owners can view their pets' chat messages"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1 from public.chat_sessions cs
    join public.pets p on p.id = cs.pet_id
    where cs.id = chat_messages.session_id
    and p.owner_id = auth.uid()
  )
);

create or replace function public.send_chat_message(
  p_share_token text,
  p_session_id uuid,
  p_caregiver_label text,
  p_role text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet_id uuid;
  v_session_id uuid;
begin
  select p.id into v_pet_id from pets p where p.share_token::text = p_share_token;
  if v_pet_id is null then
    return null;
  end if;

  if p_session_id is not null then
    select cs.id into v_session_id
    from chat_sessions cs
    where cs.id = p_session_id and cs.pet_id = v_pet_id;
  end if;

  if v_session_id is null then
    insert into chat_sessions (pet_id, caregiver_label)
    values (v_pet_id, nullif(trim(p_caregiver_label), ''))
    returning id into v_session_id;
  end if;

  insert into chat_messages (session_id, role, content)
  values (v_session_id, p_role, p_content);

  return v_session_id;
end;
$$;

revoke all on function public.send_chat_message(text, uuid, text, text, text) from public;
grant execute on function public.send_chat_message(text, uuid, text, text, text) to anon, authenticated;
