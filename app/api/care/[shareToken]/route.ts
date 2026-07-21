import { mapPetRecord } from "@/lib/pets";
import { createPublicClient } from "@/lib/supabase/public-server";
import { NextResponse } from "next/server";

type Context = { params: { shareToken: string } };

export async function GET(_: Request, { params }: Context) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_shared_pet", {
    p_share_token: params.shareToken,
  });
  if (error || !data) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({ pet: mapPetRecord(data as Record<string, unknown>) });
}
