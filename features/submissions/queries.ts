import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { submissions, submissionAttachments } from "@/db/schema";
import { getCurrentAdmin } from "@/features/auth/session";

export async function getSubmission(id: string) {
  if (!(await getCurrentAdmin()) || !/^[1-9]\d*$/.test(id)) return null;
  const row = (await getDb().select().from(submissions).where(eq(submissions.id, BigInt(id))).limit(1))[0];
  if (!row) return null;
  const attachments = await getDb().select().from(submissionAttachments).where(eq(submissionAttachments.submissionId, row.id));
  return { ...row, id: row.id.toString(), formId: row.formId.toString(), revisionId: row.revisionId.toString(), attachments: attachments.map((a) => ({ ...a, id: a.id.toString(), submissionId: a.submissionId.toString() })) };
}
export async function listSubmissions(formKey?: string) {
  if (!(await getCurrentAdmin())) return null;
  const rows = await getDb().select().from(submissions).where(formKey ? eq(submissions.formKey, formKey) : undefined).orderBy(desc(submissions.createdAt)).limit(100);
  return rows.map((row) => ({ ...row, id: row.id.toString(), formId: row.formId.toString(), revisionId: row.revisionId.toString() }));
}
export async function getSubmissionAttachment(id: string) {
  if (!(await getCurrentAdmin()) || !/^[1-9]\d*$/.test(id)) return null;
  return (await getDb().select().from(submissionAttachments).where(eq(submissionAttachments.id, BigInt(id))).limit(1))[0] ?? null;
}
