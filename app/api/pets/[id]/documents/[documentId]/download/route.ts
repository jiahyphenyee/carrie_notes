import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

const BUCKET = "pet-documents";
type Context = { params: { id: string; documentId: string } };

export async function GET(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", params.documentId)
    .eq("pet_id", params.id)
    .single();
  if (fetchError || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(document.storage_path, 60);
  if (signError || !signed) return NextResponse.json({ error: "Could not generate a link." }, { status: 500 });

  return NextResponse.redirect(signed.signedUrl);
}
