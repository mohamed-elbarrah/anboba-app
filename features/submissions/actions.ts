"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { submissions } from "@/db/schema";
import { sendSubmissionNotification, submissionNotificationSender } from "./email";
import { getCurrentAdmin } from "@/features/auth/session";

const statuses = new Set(["new", "in_review", "accepted", "rejected", "archived"]);
export async function updateSubmissionStatus(id: string, status: string) {
  if (!(await getCurrentAdmin())) return { ok: false, code: "AUTH_REQUIRED" } as const;
  if (!/^[1-9]\d*$/.test(id) || !statuses.has(status)) return { ok: false, code: "INVALID_INPUT" } as const;
  await getDb().update(submissions).set({ status: status as "new" | "in_review" | "accepted" | "rejected" | "archived" }).where(eq(submissions.id, BigInt(id)));
  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${id}`);
  return { ok: true } as const;
}
export async function retrySubmissionNotification(id: string) {
  if (!(await getCurrentAdmin())) return { ok: false, code: "AUTH_REQUIRED" } as const;
  if (!/^[1-9]\d*$/.test(id)) return { ok: false, code: "INVALID_INPUT" } as const;
  const row = (await getDb().select().from(submissions).where(and(eq(submissions.id, BigInt(id)), eq(submissions.notificationStatus, "failed"))).limit(1))[0];
  if (!row) return { ok: false, code: "NOT_FOUND" } as const;
  try {
    await sendSubmissionNotification({ formKey: row.formKey, submissionId: row.id.toString(), senderName: submissionNotificationSender(row.formKey, row.payloadJson), submittedAt: row.createdAt });
    await getDb().update(submissions).set({ notificationStatus: "sent", notificationError: null, notifiedAt: new Date() }).where(eq(submissions.id, row.id));
    revalidatePath("/dashboard/messages");
    revalidatePath(`/dashboard/messages/${id}`);
    return { ok: true } as const;
  } catch (error) {
    console.error("[submission:notification-retry]", error instanceof Error ? error.message : "unknown error");
    await getDb().update(submissions).set({ notificationStatus: "failed", notificationError: "Notification delivery failed" }).where(eq(submissions.id, row.id));
    return { ok: false, code: "NOTIFICATION_FAILED" } as const;
  }
}
