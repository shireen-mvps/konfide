import { NextRequest } from "next/server";
import pdfParse from "pdf-parse";
import { vectorIndex } from "@/lib/upstash";
import { chunkText } from "@/lib/chunker";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docId = formData.get("docId") as string | null;

  // Validate before streaming
  if (!file || !docId) {
    return Response.json({ error: "Missing file or docId." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        // Step 1 — Extract
        send({ step: "extracting", label: "Extracting text from PDF..." });
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        const rawText = pdfData.text;

        if (!rawText || rawText.trim().length < 50) {
          send({ error: "Could not extract text from this PDF. It may be scanned or image-based." });
          controller.close();
          return;
        }

        // Step 2 — Chunk
        send({ step: "chunking", label: "Splitting into chunks..." });
        const chunks = chunkText(rawText);

        if (chunks.length === 0) {
          send({ error: "No usable text found in this PDF." });
          controller.close();
          return;
        }

        // Step 3 — Index
        send({ step: "indexing", label: `Indexing ${chunks.length} chunks...` });

        try {
          await vectorIndex.namespace(docId).reset();
        } catch {
          // Namespace may not exist yet — fine
        }

        const ns = vectorIndex.namespace(docId);
        const records = chunks.map((text, i) => ({
          id: `${docId}-chunk-${i}`,
          data: text,
          metadata: { text, chunkIndex: i, filename: file.name, totalChunks: chunks.length },
        }));

        const batchSize = 20;
        for (let i = 0; i < records.length; i += batchSize) {
          await ns.upsert(records.slice(i, i + batchSize));
        }

        // Done
        send({
          step: "done",
          label: "Ready",
          success: true,
          filename: file.name,
          chunks: chunks.length,
          pages: pdfData.numpages,
        });
      } catch (err) {
        console.error("Upload error:", err);
        send({ error: "Something went wrong processing your PDF." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
