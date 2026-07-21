import { extractDocumentText } from "@/lib/document-extraction";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET = "pet-documents";

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Context = { params: { id: string } };

export async function GET(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return apiError("Unauthorized", 401);

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("pet_id", params.id)
    .order("created_at", { ascending: false });
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ documents: data || [] });
}

export async function POST(request: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return apiError("Unauthorized", 401);

  const formData = await request.formData();
  const uploaded = formData.get("file");
  const rawLabel = formData.get("document_type");
  const requestedType = typeof rawLabel === "string" ? rawLabel.trim() : "";
  const documentType = DOCUMENT_TYPES.some((type) => type.value === requestedType) ? requestedType : "other";
  const file = uploaded instanceof File ? uploaded : undefined;

  if (!file) return apiError("Choose a file to upload.");
  if (file.size > MAX_FILE_SIZE) return apiError("Files must be 10 MB or smaller.");

  const documentId = crypto.randomUUID();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${params.id}/${documentId}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (uploadError) return apiError(uploadError.message, 500);

  const extractedText = await extractDocumentText(file);

  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      pet_id: params.id,
      file_name: file.name,
      file_type: file.type,
      document_type: documentType,
      storage_path: storagePath,
      extracted_text: extractedText,
    })
    .select()
    .single();
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    return apiError(insertError.message, 500);
  }

  return NextResponse.json({ document: data }, { status: 201 });
}
