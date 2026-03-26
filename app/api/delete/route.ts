import { vectorIndex } from "@/lib/upstash";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { docId } = await req.json();
    if (!docId) return Response.json({ error: "Missing docId." }, { status: 400 });

    try {
      await vectorIndex.namespace(docId).reset();
    } catch {
      // Namespace may not exist yet — fine
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
