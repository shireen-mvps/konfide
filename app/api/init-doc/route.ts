import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { vectorIndex } from "@/lib/upstash";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { docId } = await req.json();
    if (!docId) return Response.json({ error: "Missing docId." }, { status: 400 });

    const ns = vectorIndex.namespace(docId);

    // Query with varied prompts to get a representative sample of the document
    const [r1, r2, r3] = await Promise.all([
      ns.query({ data: "overview introduction summary background", topK: 3, includeMetadata: true }),
      ns.query({ data: "main topics key points details", topK: 3, includeMetadata: true }),
      ns.query({ data: "findings results conclusion recommendations", topK: 2, includeMetadata: true }),
    ]);

    // Deduplicate by chunkIndex
    const seen = new Set<number>();
    const chunks = [...r1, ...r2, ...r3]
      .filter((r) => {
        const idx = r.metadata?.chunkIndex as number;
        if (seen.has(idx)) return false;
        seen.add(idx);
        return true;
      })
      .slice(0, 6)
      .map((r) => r.metadata?.text as string)
      .filter(Boolean);

    if (chunks.length === 0) {
      return Response.json({ summary: null, questions: [] });
    }

    const context = chunks.join("\n\n---\n\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      prompt: `You are analyzing an uploaded document. Based on the excerpts below, provide:

1. A 2-sentence summary describing specifically what this document is about (mention the actual subject matter, not generic phrases like "this document covers...")
2. Five specific questions a user would genuinely want to ask about this document — based on actual content found in the excerpts, not generic questions like "what is this document about?"

Respond with JSON only, exactly in this format:
{
  "summary": "...",
  "questions": ["...", "...", "...", "...", "..."]
}

Document excerpts:
${context}`,
    });

    let parsed: { summary: string; questions: string[] };
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      // Claude sometimes wraps JSON in markdown code blocks
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = match ? JSON.parse(match[1].trim()) : { summary: null, questions: [] };
    }

    return Response.json({ summary: parsed.summary ?? null, questions: parsed.questions ?? [] });
  } catch (err) {
    console.error("init-doc error:", err);
    return Response.json({ summary: null, questions: [] });
  }
}
