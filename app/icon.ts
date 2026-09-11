import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPublishedFavicon } from "@/features/settings/queries";
import { storageDirectory } from "@/features/media/storage";

// The selected media can change without a deployment. Do not let the metadata
// route become a build-time snapshot of the CMS.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const size = { width: 32, height: 32 };

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const fallbackPath = path.join(process.cwd(), "public", "brand", "favicon-fallback.png");

type IconAsset = { bytes: Buffer; contentType: string; version: string };

function hasSignature(bytes: Uint8Array, contentType: string) {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (contentType === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (contentType === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (contentType === "image/gif") {
    const header = Buffer.from(bytes.subarray(0, 6)).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  return contentType === "image/webp" && Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP";
}

/** Only the upload namespace is readable; URLs cannot escape the media store. */
function localMediaPath(storageKey: string) {
  // storageKey is the canonical identity assigned by the upload service. The
  // allowlist and containment check protect the configurable storage root.
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(storageKey)) return null;
  const root = path.resolve(storageDirectory());
  const candidate = path.resolve(root, storageKey);
  return candidate === root || candidate.startsWith(`${root}${path.sep}`) ? candidate : null;
}

async function loadAsset(): Promise<IconAsset> {
  try {
    const selected = await getPublishedFavicon();
    if (selected && allowedTypes.has(selected.mimeType)) {
      const filePath = localMediaPath(selected.storageKey);
      if (filePath) {
        const bytes = await readFile(/* turbopackIgnore: true */ filePath);
        // Validate both the CMS MIME declaration and the bytes on every read.
        if (bytes.length > 0 && bytes.length <= 10 * 1024 * 1024 && hasSignature(bytes, selected.mimeType)) {
          return { bytes, contentType: selected.mimeType, version: `published-${selected.revisionId}-${selected.mediaId}` };
        }
      }
    }
  } catch {
    // A missing database/media file must never make the browser lose its icon.
  }

  const bytes = await readFile(fallbackPath);
  return { bytes, contentType: "image/png", version: "fallback" };
}

export default async function Icon() {
  const asset = await loadAsset();
  const etag = `"anboba-favicon-${asset.version}"`;
  const body = asset.bytes.buffer.slice(asset.bytes.byteOffset, asset.bytes.byteOffset + asset.bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": asset.contentType,
      // Revalidate so a published revision is picked up without an app deploy.
      "Cache-Control": "public, max-age=0, must-revalidate",
      ETag: etag,
    },
  });
}
