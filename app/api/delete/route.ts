import { vectorIndex } from "@/lib/upstash";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { docId } = await req.json();
    if (!docId) return Response.json({ error: "Missing docId." }, { status: 400 });

    // Delete from Upstash Vector
    try {
      await vectorIndex.namespace(docId).reset();
    } catch {
      // Namespace may not exist yet — fine
    }

    // Delete from Supabase if user is signed in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("documents").delete().eq("user_id", user.id).eq("doc_id", docId);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
