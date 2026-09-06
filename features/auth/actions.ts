"use server";

import { compare, hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { createSession, deleteCurrentSession, requireAdmin, revokeAdminSessions } from "./session";
import { loginSchema, profileSchema, type LoginState, type ProfileState } from "./schema";
import { clearLoginFailures, loginIdentifier, loginIsBlocked, recordLoginFailure } from "./rate-limit";

const genericLoginError = "Invalid email or password.";

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip") ?? "unknown";
  const identifier = loginIdentifier(parsed.data.email, ip);
  if (await loginIsBlocked(identifier)) return { error: "Too many attempts. Try again later." };
  const admin = (await getDb().select().from(admins).where(and(eq(admins.emailNormalized, parsed.data.email), eq(admins.isActive, true))).limit(1))[0];
  const valid = await compare(parsed.data.password, admin?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEe.6Q7F4g3U3GqS5g5S5g5S5g5S5g5S5g5");
  if (!admin || !valid) { await recordLoginFailure(identifier); return { error: genericLoginError }; }
  await clearLoginFailures(identifier);
  await createSession(admin.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteCurrentSession();
  redirect("/login");
}

export async function updateProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireAdmin();
  const parsed = profileSchema.safeParse({ currentPassword: formData.get("currentPassword"), email: formData.get("email"), newPassword: formData.get("newPassword") });
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!(await compare(parsed.data.currentPassword, admin.passwordHash))) return { ok: false, message: "Current password is incorrect." };
  const values: { email?: string; emailNormalized?: string; passwordHash?: string; passwordChangedAt?: Date } = {};
  if (parsed.data.email && parsed.data.email !== admin.emailNormalized) {
    const duplicate = await getDb().select({ id: admins.id }).from(admins).where(and(eq(admins.emailNormalized, parsed.data.email), eq(admins.isActive, true))).limit(1);
    if (duplicate.length) return { ok: false, message: "That email address is already in use." };
    values.email = parsed.data.email;
    values.emailNormalized = parsed.data.email;
  }
  if (parsed.data.newPassword) { values.passwordHash = await hash(parsed.data.newPassword, 12); values.passwordChangedAt = new Date(); }
  if (!Object.keys(values).length) return { ok: false, message: "No changes to save." };
  await getDb().update(admins).set(values).where(eq(admins.id, admin.id));
  await revokeAdminSessions(admin.id);
  await deleteCurrentSession();
  return { ok: true, message: "Profile updated. Please sign in again." };
}
