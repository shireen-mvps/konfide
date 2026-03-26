import { anthropic } from "@ai-sdk/anthropic";
import { createDataStreamResponse, streamText } from "ai";
import { vectorIndex } from "@/lib/upstash";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages, docId } = await req.json();

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
      topK: 4,
      includeMetadata: true,
    });

    const sources = results
      .filter((r) => r.score > 0.5) // only include reasonably relevant chunks
      .map((r) => ({
        text: r.metadata?.text as string,
        chunkIndex: r.metadata?.chunkIndex as number,
        score: Math.round((r.score ?? 0) * 100),
      }));

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
          system: `You are a helpful assistant that answers questions based on the content of an uploaded document.

Use ONLY the context provided below to answer the question.

If the answer isn't in the context, say briefly: "That information isn't available in the extracted text of this document." Then stop — do not suggest visiting websites, opening the physical book, or looking elsewhere. The user is here to query this document only.

Note: PDF covers, images, and scanned pages cannot be extracted as text, so visual content will not be available.

Format your answers clearly using markdown:
- Use numbered lists or bullet points when listing items, steps, or multiple points
- Use **bold** for key terms or important information
- Use short paragraphs — avoid long walls of text
- When you use information from the context, reference it naturally (e.g., "According to the document..." or "The document mentions...")

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
