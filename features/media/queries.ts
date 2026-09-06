import "server-only";

import { desc } from "drizzle-orm";
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
