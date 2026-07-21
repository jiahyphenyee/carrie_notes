import { petFormSchema } from "@/lib/pet-validation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return apiError("Unauthorized", 401);

  const { data, error } = await supabase
    .from("pets")
    .select("id, name, nickname, breed, age, photo_url, created_at, share_token")
    .order("created_at", { ascending: false });
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ pets: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return apiError("Unauthorized", 401);

  const parsed = petFormSchema.safeParse(await request.json());
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Invalid pet profile.");
  const values = parsed.data;

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .insert({
      owner_id: authData.user.id,
      name: values.name,
      nickname: values.nickname || null,
      age: values.age || null,
      breed: values.breed || null,
      blood_type: values.blood_type || null,
    })
    .select("id")
    .single();
  if (petError || !pet) return apiError(petError?.message || "Could not create pet.", 500);

  const { error: detailsError } = await supabase.from("care_details").insert({
    pet_id: pet.id,
    routine: values.routine,
    meals: values.meals,
    medical: values.medical,
    behavior: values.behavior,
    emergency: values.emergency,
  });
  if (detailsError) return apiError(detailsError.message, 500);

  if (values.vaccinations.length) {
    const { error: vaccinationError } = await supabase.from("vaccinations").insert(
      values.vaccinations.map((vaccination) => ({
        pet_id: pet.id,
        vaccine_name: vaccination.vaccine_name,
        date_administered: vaccination.date_administered || null,
        expiry_date: vaccination.expiry_date || null,
        vet_name: vaccination.vet_name,
        notes: vaccination.notes,
      })),
    );
    if (vaccinationError) return apiError(vaccinationError.message, 500);
  }

  return NextResponse.json({ id: pet.id }, { status: 201 });
}
