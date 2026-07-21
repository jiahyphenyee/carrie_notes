import { embedTexts } from "@/lib/embeddings";
import { openai } from "@/lib/openai";
import { createPublicClient } from "@/lib/supabase/public-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 1000;
const FALLBACK_ANSWER = "I don't have that information in this pet's profile or documents yet.";
// A fixed similarity cutoff doesn't hold up across questions/corpus sizes,
// so relevance is judged relative to the best match instead: a chunk must
// be at least this fraction as similar as the top hit to count as a real
// source, not noise (e.g. "Meals" surfacing for a vaccine question).
const RELATIVE_SIMILARITY_FLOOR = 0.6;

const answerInstructions = `You are answering a caregiver's question about a pet, using only the provided context chunks from the owner's care profile and documents. Read every chunk fully before deciding whether the answer is present -- the answer is often a short phrase inside a longer chunk (e.g. one item in a comma-separated "Likes" list), not always its own dedicated chunk. Answer clearly and directly in a sentence or two when the context supports it. Only say the context doesn't cover something after checking all chunks; don't hedge or claim information is missing when it is actually present. Be extra careful with anything medical, emergency, or safety related: never invent names, dosages, dates, or contact details that are not present in the context, and if a document chunk appears to be about a different, unnamed pet, treat it as unreliable background rather than a reason to doubt a clearly stated profile fact.`;

type Chunk = { source_type: string; source_label: string; content: string; similarity: number };
type Context = { params: { shareToken: string } };

export async function POST(request: Request, { params }: Context) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  if (!question) return NextResponse.json({ error: "Ask a question." }, { status: 400 });

  const supabase = createPublicClient();
  const [queryEmbedding] = await embedTexts([question]);
  const { data: chunks, error } = await supabase.rpc("match_pet_chunks", {
    p_share_token: params.shareToken,
    p_query_embedding: queryEmbedding,
    p_match_count: 6,
  });

  const allMatches = (chunks as Chunk[] | null) || [];
  const topSimilarity = allMatches[0]?.similarity ?? 0;
  const matches = allMatches.filter((chunk) => chunk.similarity >= topSimilarity * RELATIVE_SIMILARITY_FLOOR);

  if (error || !matches.length) {
    return NextResponse.json({ answer: FALLBACK_ANSWER, sources: [] });
  }

  const context = matches.map((chunk) => `[${chunk.source_type}: ${chunk.source_label}]\n${chunk.content}`).join("\n\n---\n\n");

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    instructions: answerInstructions,
    input: `Context:\n${context}\n\nQuestion: ${question}`,
    temperature: 0.1,
  });

  const sources = Array.from(
    new Map(matches.map((chunk) => [`${chunk.source_type}:${chunk.source_label}`, { source_type: chunk.source_type, source_label: chunk.source_label }])).values(),
  );

  return NextResponse.json({ answer: response.output_text.trim(), sources });
}
