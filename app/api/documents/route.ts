import { createClient } from "@/lib/supabase/server";
import type { DocMeta } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ docs: {} });

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return Response.json({ docs: {} });

  const docs: Record<string, DocMeta> = {};
  for (const row of data) {
    docs[row.doc_id] = {
      filename: row.filename,
      pages: row.pages,
      chunks: row.chunks,
      summary: row.summary ?? undefined,
      suggestedQuestions: row.suggested_questions ?? undefined,
    };
  }

  return Response.json({ docs });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { docId, meta }: { docId: string; meta: DocMeta } = await req.json();

  // Check if record already exists for this user+docId
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", user.id)
    .eq("doc_id", docId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("documents")
      .update({
        filename: meta.filename,
        pages: meta.pages,
        chunks: meta.chunks,
        summary: meta.summary ?? null,
        suggested_questions: meta.suggestedQuestions ?? null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("documents").insert({
      user_id: user.id,
      doc_id: docId,
      filename: meta.filename,
      pages: meta.pages,
      chunks: meta.chunks,
      summary: meta.summary ?? null,
      suggested_questions: meta.suggestedQuestions ?? null,
    });
  }

  return Response.json({ success: true });
}
