import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

const BUCKET = "pet-documents";
type Context = { params: { id: string; documentId: string } };

export async function DELETE(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path, file_name")
    .eq("id", params.documentId)
    .eq("pet_id", params.id)
    .single();
  if (fetchError || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", params.documentId)
    .eq("pet_id", params.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.storage.from(BUCKET).remove([document.storage_path]).catch(() => undefined);
  await supabase.from("doc_chunks").delete().eq("pet_id", params.id).eq("source_type", "document").eq("source_label", document.file_name);
  return new NextResponse(null, { status: 204 });
}
