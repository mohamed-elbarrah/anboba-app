import "server-only";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authLoginAttempts } from "@/db/schema";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function loginIdentifier(email: string, ip: string) { return createHash("sha256").update(`${email}|${ip.slice(0, 100)}`).digest("hex"); }

export async function loginIsBlocked(identifier: string) {
  const row = (await getDb().select().from(authLoginAttempts).where(eq(authLoginAttempts.identifier, identifier)).limit(1))[0];
  return Boolean(row?.lockedUntil && row.lockedUntil > new Date());
}

export async function recordLoginFailure(identifier: string) {
  const now = new Date();
  const row = (await getDb().select().from(authLoginAttempts).where(eq(authLoginAttempts.identifier, identifier)).limit(1))[0];
  if (!row) {
    await getDb().insert(authLoginAttempts).values({ identifier, failures: 1, firstAttemptAt: now, lockedUntil: null });
    return;
  }
  if (now.getTime() - row.firstAttemptAt.getTime() > WINDOW_MS) {
    await getDb().update(authLoginAttempts).set({ failures: 1, firstAttemptAt: now, lockedUntil: null }).where(eq(authLoginAttempts.identifier, identifier));
    return;
  }
  const failures = row.failures + 1;
  await getDb().update(authLoginAttempts).set({ failures, lockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + WINDOW_MS) : null }).where(eq(authLoginAttempts.identifier, identifier));
}

export async function clearLoginFailures(identifier: string) {
  await getDb().delete(authLoginAttempts).where(eq(authLoginAttempts.identifier, identifier));
}
