import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { z } from "zod";
import { NextResponse } from "next/server";

const vaccinationSchema = z.object({
  vaccine_name: z.string().trim().min(1).max(200),
  date_administered: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  vet_name: z.string().max(4000).optional().default(""),
  notes: z.string().max(4000).optional().default(""),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = vaccinationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A vaccine name is required." }, { status: 400 });
  const { data, error } = await supabase
    .from("vaccinations")
    .insert({ ...parsed.data, pet_id: params.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vaccination: data }, { status: 201 });
}
