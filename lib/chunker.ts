/**
 * Splits text into overlapping chunks for RAG.
 * Tries to break at sentence boundaries for cleaner context.
 */
export function chunkText(
  text: string,
  maxChars = 800,
  overlap = 120
): string[] {
  // Clean up excessive whitespace from PDF extraction
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);

    // Try to end at a sentence boundary (. ! ?) if not at end of text
    if (end < cleaned.length) {
      const sentenceBreak = Math.max(
        cleaned.lastIndexOf(". ", end),
        cleaned.lastIndexOf("! ", end),
        cleaned.lastIndexOf("? ", end),
        cleaned.lastIndexOf("\n\n", end)
      );
      // Only use the sentence break if it's reasonably far into the chunk
      if (sentenceBreak > start + maxChars * 0.5) {
        end = sentenceBreak + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk); // skip tiny fragments

    const next = end - overlap;
    if (next <= start) start = end; // guard against infinite loop
    else start = next;
    if (start >= cleaned.length) break;
  }

  return chunks;
}
