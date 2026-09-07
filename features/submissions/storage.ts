import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["application/pdf", "pdf"]]);
export function submissionStorageDirectory() {
  const configured = process.env.SUBMISSION_STORAGE_DIR;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("SUBMISSION_STORAGE_DIR is required in production");
  return configured || path.join(process.cwd(), ".data", "submissions");
}
function signature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((v, i) => v === [137,80,78,71,13,10,26,10][i]);
  return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}
export async function saveSubmissionFile(file: File) {
  const extension = allowed.get(file.type);
  if (!extension || file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) throw new Error("Invalid attachment");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!signature(bytes, file.type)) throw new Error("Invalid attachment content");
  const storageKey = `${randomUUID()}.${extension}`;
  const directory = submissionStorageDirectory();
  await mkdir(directory, { recursive: true });
  const absolutePath = path.join(/* turbopackIgnore: true */ directory, storageKey);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), { flag: "wx", mode: 0o600 });
  return { storageKey, absolutePath, originalFilename: file.name.slice(0, 255) || `attachment.${extension}`, mimeType: file.type, sizeBytes: file.size };
}
export async function readSubmissionFile(storageKey: string) {
  if (!/^[a-f0-9-]+\.(jpg|png|pdf)$/.test(storageKey)) throw new Error("Invalid storage key");
  return readFile(path.join(/* turbopackIgnore: true */ submissionStorageDirectory(), storageKey));
}
export async function removeSubmissionFile(storageKey: string) { await unlink(path.join(/* turbopackIgnore: true */ submissionStorageDirectory(), storageKey)).catch(() => undefined); }
