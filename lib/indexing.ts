import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { buildProfileSections } from "@/lib/profile-text";
import type { PetFormValues } from "@/lib/pets";
import type { createAuthServerClient } from "@/lib/supabase/auth-server";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerClient>>;
type ChunkInsert = { pet_id: string; source_type: string; source_label: string; content: string };

async function embedAndInsert(supabase: SupabaseClient, rows: ChunkInsert[]) {
  if (!rows.length) return;
  const embeddings = await embedTexts(rows.map((row) => row.content));
  const { error } = await supabase.from("doc_chunks").insert(rows.map((row, index) => ({ ...row, embedding: embeddings[index] })));
  if (error) throw error;
}

/**
 * Best-effort: a failure here shouldn't block a document upload or profile
 * save, matching the precedent set by extractDocumentText in Step 5.
 */
export async function indexDocumentChunks(supabase: SupabaseClient, petId: string, fileName: string, text: string) {
  try {
    await supabase.from("doc_chunks").delete().eq("pet_id", petId).eq("source_type", "document").eq("source_label", fileName);
    const rows = chunkText(text).map((content) => ({ pet_id: petId, source_type: "document", source_label: fileName, content }));
    await embedAndInsert(supabase, rows);
  } catch (cause) {
    console.error("Document indexing failed", cause);
  }
}

export async function indexProfileChunks(supabase: SupabaseClient, petId: string, pet: PetFormValues) {
  try {
    await supabase.from("doc_chunks").delete().eq("pet_id", petId).eq("source_type", "profile");
    const rows = buildProfileSections(pet).flatMap((section) =>
      chunkText(section.content).map((content) => ({ pet_id: petId, source_type: "profile", source_label: section.label, content })),
    );
    await embedAndInsert(supabase, rows);
  } catch (cause) {
    console.error("Profile indexing failed", cause);
  }
}
