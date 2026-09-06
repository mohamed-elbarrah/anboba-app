import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/features/auth/session";
import { getDb } from "@/db/connection";
import { media } from "@/db/schema";
import { removeFile, saveFile, validateFile } from "@/features/media/storage";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost || request.headers.get("host");
  const protocol = forwardedProto || new URL(request.url).protocol.replace(":", "");
  return origin === `${protocol}://${host}`;
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 105 * 1024 * 1024) return NextResponse.json({ error: "File exceeds the allowed size" }, { status: 413 });

  try {
    const formData = await request.formData();
    const value = formData.get("file");
    if (!(value instanceof File)) return NextResponse.json({ error: "A file is required" }, { status: 400 });
    const format = await validateFile(value);
    const saved = await saveFile(value, format);
    try {
      const result = await getDb().insert(media).values({
        storageKey: saved.filename,
        publicPath: saved.publicPath,
        originalFilename: value.name.slice(0, 255),
        mimeType: format.mimeType,
        kind: format.kind,
        sizeBytes: value.size,
        uploadedBy: admin.id,
      });
      return NextResponse.json({ id: result[0].insertId.toString(), path: saved.publicPath, mimeType: format.mimeType, size: value.size }, { status: 201 });
    } catch (error) {
      await removeFile(saved.absolutePath);
      throw error;
    }
  } catch (error) {
    console.error("Media upload failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
