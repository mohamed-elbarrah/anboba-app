import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/connection";
import { media } from "@/db/schema";
import type { MediaItem } from "./types";

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await getDb().select().from(media).orderBy(desc(media.createdAt));
  return rows.map((item) => ({
    id: item.id.toString(),
    publicPath: item.publicPath,
    originalFilename: item.originalFilename,
    mimeType: item.mimeType,
    kind: item.kind,
    sizeBytes: item.sizeBytes,
    createdAt: item.createdAt,
  }));
}

/**
 * Resolve only an existing image by its CMS ID. IDs and paths are never
 * accepted from public props, so a stale/deleted reference cannot select an
 * arbitrary URL or turn the phone mockup into a video.
 */
export async function resolvePublicImagePath(mediaId?: string, externalUrl?: string): Promise<string | null> {
  // A valid media ID always wins over the URL, preventing an untrusted URL from
  // replacing a selected library asset.
  if (mediaId && /^[1-9]\d*$/.test(mediaId)) {
    const row = await getDb()
      .select({ publicPath: media.publicPath })
      .from(media)
      .where(and(eq(media.id, BigInt(mediaId)), eq(media.kind, "image")))
      .limit(1);
    const publicPath = row[0]?.publicPath;
    if (publicPath && publicPath.startsWith("/") && !publicPath.startsWith("//") && !/[\u0000-\u0020\u007f\\]/.test(publicPath)) return publicPath;
  }

  if (!externalUrl || /[\u0000-\u0020\u007f\\]/.test(externalUrl) || externalUrl.startsWith("//")) return null;
  if (externalUrl.startsWith("/")) return externalUrl;
  try {
    const parsed = new URL(externalUrl);
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return null;
    return externalUrl;
  } catch {
    return null;
  }
}
