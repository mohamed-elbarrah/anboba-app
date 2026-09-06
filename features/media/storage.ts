import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MediaKind } from "./types";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const formats = {
  "image/jpeg": { kind: "image", extension: "jpg" },
  "image/png": { kind: "image", extension: "png" },
  "image/webp": { kind: "image", extension: "webp" },
  "image/gif": { kind: "image", extension: "gif" },
  "video/mp4": { kind: "video", extension: "mp4" },
  "video/webm": { kind: "video", extension: "webm" },
} as const satisfies Record<string, { kind: MediaKind; extension: string }>;

export type DetectedFormat = (typeof formats)[keyof typeof formats] & { mimeType: keyof typeof formats };

export function getFormat(mimeType: string) {
  return formats[mimeType as keyof typeof formats] ?? null;
}

export function storageDirectory() {
  return process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), "public", "uploads");
}

function matchesSignature(bytes: Uint8Array, mimeType: string) {
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (mimeType === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (mimeType === "image/png") return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mimeType === "image/gif") return new TextDecoder().decode(bytes.slice(0, 6)) === "GIF87a" || new TextDecoder().decode(bytes.slice(0, 6)) === "GIF89a";
  if (mimeType === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (mimeType === "video/webm") return startsWith(0x1a, 0x45, 0xdf, 0xa3);
  if (mimeType === "video/mp4") return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  return false;
}

export async function validateFile(file: File) {
  const format = getFormat(file.type);
  if (!format) throw new Error("Unsupported file type");
  const maxBytes = format.kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size === 0 || file.size > maxBytes) throw new Error("File exceeds the allowed size");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(bytes, file.type)) throw new Error("File content does not match its type");
  return { ...format, mimeType: file.type as keyof typeof formats };
}

export async function saveFile(file: File, format: DetectedFormat) {
  const filename = `${randomUUID()}.${format.extension}`;
  const directory = storageDirectory();
  await mkdir(directory, { recursive: true });
  const absolutePath = path.join(/* turbopackIgnore: true */ directory, filename);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), { flag: "wx", mode: 0o644 });
  return { filename, absolutePath, publicPath: `/uploads/${filename}` };
}

export async function removeFile(absolutePath: string) {
  await unlink(absolutePath).catch(() => undefined);
}
