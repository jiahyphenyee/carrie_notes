import { openai } from "@/lib/openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

/** Batched embedding call. Output dimensions (1536) match the doc_chunks.embedding column. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return response.data.map((item) => item.embedding);
}
