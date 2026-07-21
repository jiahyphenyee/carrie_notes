-- Step 8 follow-up: get_shared_pet (004) hardcodes its field list and was
-- never updated when the gender column was added, so caregivers could
-- never see it even though it's saved. Re-create with gender included.
-- Run this in the Supabase SQL editor as the project owner.

create or replace function public.get_shared_pet(p_share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'nickname', p.nickname,
    'age', p.age,
    'breed', p.breed,
    'gender', p.gender,
    'blood_type', p.blood_type,
    'photo_url', p.photo_url,
    'care_details', (
      select jsonb_build_object(
        'routine', cd.routine,
        'meals', cd.meals,
        'medical', cd.medical,
        'behavior', cd.behavior,
        'emergency', cd.emergency
      )
      from care_details cd
      where cd.pet_id = p.id
    ),
    'vaccinations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'vaccine_name', v.vaccine_name,
        'date_administered', v.date_administered,
        'expiry_date', v.expiry_date,
        'vet_name', v.vet_name,
        'notes', v.notes
      ))
      from vaccinations v
      where v.pet_id = p.id
    ), '[]'::jsonb)
  )
  into result
  from pets p
  where p.share_token::text = p_share_token;

  return result;
end;
$$;
