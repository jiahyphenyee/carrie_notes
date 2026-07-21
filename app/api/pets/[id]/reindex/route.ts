import { indexDocumentChunks, indexProfileChunks } from "@/lib/indexing";
import { mapPetRecord } from "@/lib/pets";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Context = { params: { id: string } };

/**
 * Rebuilds every doc_chunks row for a pet: profile sections plus every
 * document's extracted text. Backfills pets/documents saved before this
 * step existed, and doubles as a manual "fix if search looks stale" action.
 */
export async function POST(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return apiError("Unauthorized", 401);

  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("*, care_details(*), vaccinations(*)")
    .eq("id", params.id)
    .single();
  if (petError || !petRow) return apiError("Pet not found.", 404);

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("file_name, extracted_text")
    .eq("pet_id", params.id);
  if (documentsError) return apiError(documentsError.message, 500);

  await indexProfileChunks(supabase, params.id, mapPetRecord(petRow));
  for (const document of documents || []) {
    if (document.extracted_text) await indexDocumentChunks(supabase, params.id, document.file_name, document.extracted_text);
  }

  return NextResponse.json({ ok: true, documentsIndexed: (documents || []).filter((document) => document.extracted_text).length });
}
