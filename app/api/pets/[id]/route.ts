import { petFormSchema } from "@/lib/pet-validation";
import { mapPetRecord } from "@/lib/pets";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

type Context = { params: { id: string } };
const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

async function authenticatedClient() {
  const supabase = await createAuthServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET(_: Request, { params }: Context) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return error("Unauthorized", 401);
  const { data, error: queryError } = await supabase
    .from("pets")
    .select("*, care_details(*), vaccinations(*)")
    .eq("id", params.id)
    .single();
  if (queryError || !data) return error("Pet not found.", 404);
  return NextResponse.json({ pet: mapPetRecord(data) });
}

export async function PATCH(request: Request, { params }: Context) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return error("Unauthorized", 401);
  const parsed = petFormSchema.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0]?.message || "Invalid pet profile.");
  const values = parsed.data;

  const { error: petError } = await supabase
    .from("pets")
    .update({
      name: values.name,
      nickname: values.nickname || null,
      age: values.age || null,
      breed: values.breed || null,
      blood_type: values.blood_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (petError) return error(petError.message, 500);

  const { error: detailError } = await supabase.from("care_details").upsert(
    {
      pet_id: params.id,
      routine: values.routine,
      meals: values.meals,
      medical: values.medical,
      behavior: values.behavior,
      emergency: values.emergency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pet_id" },
  );
  if (detailError) return error(detailError.message, 500);

  const { error: deleteError } = await supabase.from("vaccinations").delete().eq("pet_id", params.id);
  if (deleteError) return error(deleteError.message, 500);
  if (values.vaccinations.length) {
    const { error: vaccinationError } = await supabase.from("vaccinations").insert(
      values.vaccinations.map((vaccination) => ({
        pet_id: params.id,
        vaccine_name: vaccination.vaccine_name,
        date_administered: vaccination.date_administered || null,
        expiry_date: vaccination.expiry_date || null,
        vet_name: vaccination.vet_name,
        notes: vaccination.notes,
      })),
    );
    if (vaccinationError) return error(vaccinationError.message, 500);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Context) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return error("Unauthorized", 401);
  const { error: deleteError } = await supabase.from("pets").delete().eq("id", params.id);
  if (deleteError) return error(deleteError.message, 500);
  return new NextResponse(null, { status: 204 });
}
