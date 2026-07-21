import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  vaccine_name: z.string().trim().min(1).max(200),
  date_administered: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  vet_name: z.string().max(4000).optional().default(""),
  notes: z.string().max(4000).optional().default(""),
});
type Context = { params: { id: string; vaccinationId: string } };

export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A vaccine name is required." }, { status: 400 });
  const { error } = await supabase
    .from("vaccinations")
    .update(parsed.data)
    .eq("id", params.vaccinationId)
    .eq("pet_id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase
    .from("vaccinations")
    .delete()
    .eq("id", params.vaccinationId)
    .eq("pet_id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
