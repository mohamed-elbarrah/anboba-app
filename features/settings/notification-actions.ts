"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentAdmin } from "@/features/auth/session";
import { sendSubmissionTestEmail } from "@/features/submissions/email";
import { getSubmissionNotificationRecipient, getSubmissionNotificationTemplates } from "./queries";
import {
  submissionNotificationRecipientInputSchema,
  submissionNotificationTemplateInputSchema,
} from "./notification-schema";

const testEmailBuckets = new Map<string, { count: number; resetAt: number }>();
function allowTestEmail(adminId: string) {
  const now = Date.now();
  for (const [key, bucket] of testEmailBuckets) if (bucket.resetAt <= now) testEmailBuckets.delete(key);
  const current = testEmailBuckets.get(adminId);
  if (!current || current.resetAt <= now) {
    testEmailBuckets.set(adminId, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}

async function currentAdmin() {
  try {
    return await getCurrentAdmin();
  } catch (error) {
    console.error("[settings:notification-auth]", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

const invalid = { ok: false as const, code: "INVALID_INPUT" as const };
const auth = { ok: false as const, code: "AUTH_REQUIRED" as const };
const failed = { ok: false as const, code: "REQUEST_FAILED" as const };

export type NotificationActionResult =
  | { ok: true }
  | { ok: false; code: "AUTH_REQUIRED" | "INVALID_INPUT" | "REQUEST_FAILED" };

export async function saveSubmissionNotificationRecipient(input: unknown): Promise<NotificationActionResult> {
  if (!(await currentAdmin())) return auth;
  const parsed = submissionNotificationRecipientInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    await getDb().insert(settings).values({ key: "submission_notifications", valueJson: parsed.data })
      .onDuplicateKeyUpdate({ set: { valueJson: parsed.data } });
    revalidatePath("/dashboard/settings/notifications");
    return { ok: true };
  } catch (error) {
    console.error("[settings:notification-recipient]", error instanceof Error ? error.message : "unknown error");
    return failed;
  }
}

export async function saveSubmissionNotificationTemplate(input: unknown): Promise<NotificationActionResult> {
  if (!(await currentAdmin())) return auth;
  const parsed = submissionNotificationTemplateInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  try {
    const templates = await getSubmissionNotificationTemplates();
    const next = { ...templates, [parsed.data.formKey]: parsed.data.template };
    await getDb().insert(settings).values({ key: "submission_notification_templates", valueJson: next })
      .onDuplicateKeyUpdate({ set: { valueJson: next } });
    revalidatePath("/dashboard/settings/notifications");
    return { ok: true };
  } catch (error) {
    console.error("[settings:notification-templates]", error instanceof Error ? error.message : "unknown error");
    return failed;
  }
}

export async function sendSubmissionNotificationTest(input: unknown): Promise<NotificationActionResult> {
  const admin = await currentAdmin();
  if (!admin) return auth;
  const parsed = submissionNotificationTemplateInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  if (!allowTestEmail(admin.id.toString())) return failed;
  try {
    const recipient = await getSubmissionNotificationRecipient();
    if (!recipient) return failed;
    await sendSubmissionTestEmail(recipient, parsed.data.formKey, parsed.data.template);
    revalidatePath("/dashboard/settings/notifications");
    return { ok: true };
  } catch (error) {
    console.error("[settings:notification-test]", error instanceof Error ? error.message : "unknown error");
    return failed;
  }
}
