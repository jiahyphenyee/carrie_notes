import { openai } from "@/lib/openai";
import { toFile } from "openai";

const MAX_EXTRACTED_LENGTH = 200_000;
const PLAIN_TEXT_TYPES = new Set(["text/plain", "text/markdown", "text/csv"]);

/**
 * Best-effort raw text extraction for a persisted document. Unlike the Quick
 * Fill flow in app/api/extract/route.ts, this returns verbatim text (for
 * later chunking/embedding in Step 6), not structured profile fields.
 * Returns "" on failure so the document still gets saved without it.
 */
export async function extractDocumentText(file: File): Promise<string> {
  try {
    if (PLAIN_TEXT_TYPES.has(file.type)) {
      return (await file.text()).slice(0, MAX_EXTRACTED_LENGTH);
    }

    const uploaded = await openai.files.create({
      file: await toFile(Buffer.from(await file.arrayBuffer()), file.name, { type: file.type }),
      purpose: "user_data",
    });
    try {
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        instructions: "Return the full text content of this document verbatim. Do not summarize, describe, or add commentary. If the document has no extractable text, return an empty string.",
        input: [{ role: "user", content: [{ type: "input_file", file_id: uploaded.id }] }],
      });
      return response.output_text.slice(0, MAX_EXTRACTED_LENGTH);
    } finally {
      await openai.files.delete(uploaded.id).catch(() => undefined);
    }
  } catch (cause) {
    console.error("Document text extraction failed", cause);
    return "";
  }
}
