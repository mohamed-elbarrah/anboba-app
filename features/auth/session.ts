import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { adminSessions, admins } from "@/db/schema";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-anboba_session" : "anboba_session";
const SESSION_DAYS = 14;
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function expiry() { return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000); }

export async function createSession(adminId: bigint) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = expiry();
  await getDb().insert(adminSessions).values({ id: randomBytes(24).toString("base64url"), adminId, tokenHash: hashToken(token), expiresAt });
  (await cookies()).set(COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

export const getCurrentAdmin = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = (await getDb().select({ admin: admins }).from(adminSessions).innerJoin(admins, eq(adminSessions.adminId, admins.id)).where(and(eq(adminSessions.tokenHash, hashToken(token)), isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, new Date()), eq(admins.isActive, true))).limit(1))[0];
  return row?.admin ?? null;
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export async function deleteCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await getDb().update(adminSessions).set({ revokedAt: new Date() }).where(eq(adminSessions.tokenHash, hashToken(token)));
  store.delete(COOKIE_NAME);
}

export async function revokeAdminSessions(adminId: bigint) {
  await getDb().update(adminSessions).set({ revokedAt: new Date() }).where(and(eq(adminSessions.adminId, adminId), isNull(adminSessions.revokedAt)));
}

export { COOKIE_NAME };
