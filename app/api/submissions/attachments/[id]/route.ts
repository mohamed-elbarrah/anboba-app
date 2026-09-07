import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/features/auth/session";
import { getSubmissionAttachment } from "@/features/submissions/queries";
import { readSubmissionFile } from "@/features/submissions/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const attachment = await getSubmissionAttachment(id);
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  try {
    const body = await readSubmissionFile(attachment.storageKey);
    return new Response(body, { headers: { "Content-Type": attachment.mimeType, "Content-Length": String(body.byteLength), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalFilename)}`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Attachment unavailable" }, { status: 404 }); }
}
