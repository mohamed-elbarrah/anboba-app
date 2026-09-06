import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(320);
const password = z.string().min(8, "Password must be at least 8 characters").max(128);

export const loginSchema = z.object({ email, password });
export const profileSchema = z.object({
  currentPassword: password,
  email: email.optional().or(z.literal("")),
  newPassword: password.optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (!value.email && !value.newPassword) ctx.addIssue({ code: "custom", message: "Provide a new email or password" });
  if (value.newPassword && value.newPassword === value.currentPassword) ctx.addIssue({ code: "custom", path: ["newPassword"], message: "New password must be different" });
});

export type LoginState = { error?: string; fieldErrors?: { email?: string[]; password?: string[] } } | null;
export type ProfileState = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]> };
