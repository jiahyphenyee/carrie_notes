type ChunkOptions = { maxChars?: number; overlapChars?: number };

/**
 * Splits text into overlapping, paragraph-aware chunks for embedding.
 * Overlap keeps context from being severed mid-thought at a chunk boundary.
 */
export function chunkText(text: string, { maxChars = 1000, overlapChars = 150 }: ChunkOptions = {}): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (!paragraphs.length) return [];

  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    if (paragraph.length <= maxChars) {
      current = paragraph;
    } else {
      for (let start = 0; start < paragraph.length; start += maxChars - overlapChars) {
        chunks.push(paragraph.slice(start, start + maxChars));
      }
      current = "";
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((chunk) => chunk.trim().length > 0);
}
