import { anthropic } from "@ai-sdk/anthropic";
import { createDataStreamResponse, streamText } from "ai";
import { vectorIndex } from "@/lib/upstash";
import { chatLimiter, getClientIP } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate limit check — 20 messages per IP per 24 hours
  const { success, remaining } = await chatLimiter.limit(getClientIP(req));
  if (!success) {
    return Response.json(
      { error: "RATE_LIMITED", remaining: 0 },
      { status: 429 }
    );
  }

  try {
    const { messages, docId } = await req.json();
    console.log(`[chat] IP ${getClientIP(req)} — messages remaining today: ${remaining}`);

    if (!docId) {
      return Response.json({ error: "No document loaded." }, { status: 400 });
    }

    const question = messages[messages.length - 1]?.content as string;
    if (!question) {
      return Response.json({ error: "No question provided." }, { status: 400 });
    }

    // Build a richer retrieval query by combining recent user messages.
    // This improves follow-up questions like "what about the fees?" or "tell me more."
    const recentUserQuestions = (messages as { role: string; content: string }[])
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content)
      .join(" ");
    const retrievalQuery = recentUserQuestions || question;

    // Query Upstash Vector for the most relevant chunks
    const ns = vectorIndex.namespace(docId);
    const results = await ns.query({
      data: retrievalQuery,
      topK: 5,
      includeMetadata: true,
      includeData: true, // fallback: raw chunk text if metadata.text is missing
    });

    console.log("[chat] docId:", docId);
    console.log("[chat] results count:", results.length);
    console.log("[chat] scores:", results.map((r) => r.score));
    console.log("[chat] has metadata text:", results.map((r) => !!r.metadata?.text));
    console.log("[chat] has data:", results.map((r) => !!r.data));

    const sources = results
      .map((r) => ({
        // prefer metadata.text; fall back to raw data string from the index
        text: (r.metadata?.text as string | undefined) ?? (r.data as string | undefined) ?? "",
        chunkIndex: (r.metadata?.chunkIndex as number | undefined) ?? 0,
        score: Math.round((r.score ?? 0) * 100),
      }))
      .filter((s) => s.text.trim().length > 0);

    const context =
      sources.length > 0
        ? sources.map((s, i) => `[Source ${i + 1}]:\n${s.text}`).join("\n\n")
        : "No relevant context found in the document.";

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Write sources as custom data so the client can render them
        dataStream.writeData({ sources });

        const result = streamText({
          model: anthropic("claude-sonnet-4-6"),
          maxTokens: 1024, // cap per-response cost — sufficient for RAG Q&A answers
          system: `You are a helpful assistant that answers questions based on the content of an uploaded document.

Use ONLY the context provided below to answer the question.

If the answer isn't in the context, say briefly: "That information isn't available in the extracted text of this document." Then stop — do not suggest visiting websites, opening the physical book, or looking elsewhere. The user is here to query this document only.

Note: PDF covers, images, and scanned pages cannot be extracted as text, so visual content will not be available.

Format your answers clearly using markdown:
- Use numbered lists or bullet points when listing items, steps, or multiple points
- Use **bold** for key terms or important information
- Use short paragraphs — avoid long walls of text
- After each statement that draws on a specific source, place the source number in brackets immediately after — for example: "The report found error rates dropped by 40% [1]." or "Agents are deployed in three tiers [2][3]."

Context from the document:
${context}`,
          messages,
          onFinish: () => {
            // Signal sources are attached
            dataStream.writeData({ done: true });
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError: (err) => {
        console.error("Chat stream error:", err);
        return "An error occurred while generating the response.";
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
