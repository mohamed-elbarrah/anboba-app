import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { submissions, submissionAttachments } from "@/db/schema";
import { getPublicForm } from "@/features/forms/queries";
import { validatePresetValue } from "@/features/forms/validation";
import { normalizedFromConfig, type NormalizedRevision } from "@/features/forms/normalized";
import { saveSubmissionFile, removeSubmissionFile } from "./storage";
import { sendSubmissionNotification } from "./email";
import { allowSubmission } from "./rate-limit";

export type SubmissionResult = { ok: true; id: string; successMessage: string } | { ok: false; code: string; message: string; fields?: Record<string, string> };
const text = (value: FormDataEntryValue | null) => typeof value === "string" ? value.trim() : value;

export async function submitForm(input: { formKey: string; locale: "ar" | "en"; formData: FormData; ip: string; userAgent: string | null; idempotencyToken: string }) : Promise<SubmissionResult> {
  const messages = input.locale === "ar" ? { required: "هذا الحقل مطلوب", file: "الملف غير صالح أو مطلوب", invalid: "يرجى تصحيح الحقول", option: "الخيار غير صالح" } : { required: "This field is required", file: "The file is invalid or required", invalid: "Please correct the form", option: "Invalid option" };
  if (!allowSubmission(`submission:${input.ip}:${input.formKey}`)) return { ok: false, code: "RATE_LIMITED", message: input.locale === "ar" ? "محاولات كثيرة، حاول لاحقاً" : "Too many submissions" };
  if (String(input.formData.get("website") ?? "").trim()) return { ok: true, id: "0", successMessage: "" };
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(input.formKey) || !/^[a-zA-Z0-9._~-]{8,128}$/.test(input.idempotencyToken)) return { ok: false, code: "INVALID_INPUT", message: "Invalid submission" };
  const form = await getPublicForm(input.formKey, input.locale);
  if (!form || !["contact", "join_application", "partner_registration", "generic"].includes(form.rendererKey)) return { ok: false, code: "NOT_FOUND", message: "Form not found" };
  const config: NormalizedRevision = form.normalized
    ? form.normalized
    : normalizedFromConfig(form.rendererKey, form.config, input.locale);
  const honeypot = input.formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim()) return { ok: false, code: "INVALID_INPUT", message: "Unable to submit form" };
  const errors: Record<string, string> = {};
  const payload: Record<string, unknown> = {};
  const localizations = new Map(config.localizations.map((item) => [item.fieldKey, item]));
  const saved: Array<Awaited<ReturnType<typeof saveSubmissionFile>> & { fieldKey: string }> = []; 
  for (const field of config.fields) {
    const values = input.formData.getAll(field.key);
    const file = values.find((value): value is File => value instanceof File && value.size > 0);
    if (field.type === "file") {
      if (field.required && !file) errors[field.key] = messages.file;
      if (file) { try { saved.push({ ...(await saveSubmissionFile(file)), fieldKey: field.key }); payload[field.key] = "[attachment stored securely]"; } catch { errors[field.key] = messages.file; } }
      continue;
    }
    const value = field.type === "checkbox" ? values.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean) : text(values[0] ?? null);
    if (field.required && (!value || (Array.isArray(value) && !value.length))) errors[field.key] = messages.required;
    if (value && !errors[field.key]) {
      const copy = localizations.get(field.key);
      const valid = validatePresetValue({ ...field, label: copy?.label ?? field.key, validationMessage: copy?.validationMessage ?? null }, value, input.locale);
      if (valid !== true) errors[field.key] = String(valid);
      const options = config.options[field.key] ?? [];
      if (options.length) { const selected = Array.isArray(value) ? value : [value]; if (selected.some((v) => !options.some((option) => option.key === v || option.label === v))) errors[field.key] = messages.option; }
    }
    payload[field.key] = value;
  }
  if (errors && Object.keys(errors).length) { await Promise.all(saved.map((file) => removeSubmissionFile(file.storageKey))); return { ok: false, code: "VALIDATION_ERROR", message: messages.invalid, fields: errors }; }
  const db = getDb();
  try {
    const existing = (await db.select({ id: submissions.id }).from(submissions).where(and(eq(submissions.formId, form.formId), eq(submissions.idempotencyToken, input.idempotencyToken))).limit(1))[0];
    if (existing) return { ok: true, id: existing.id.toString(), successMessage: config.copy.successMessage ?? "Submitted" };
    const result = await db.transaction(async (tx) => {
      const ipHash = createHash("sha256").update(input.ip).digest("hex");
      const inserted = await tx.insert(submissions).values({ formId: form.formId, revisionId: form.revisionId, formKey: form.formKey, locale: input.locale, payloadJson: payload, idempotencyToken: input.idempotencyToken, metadataJson: { ipHash, userAgent: input.userAgent?.slice(0, 500) ?? null } });
      const id = BigInt(inserted[0].insertId);
      if (saved.length) await tx.insert(submissionAttachments).values(saved.map((file) => ({ submissionId: id, fieldKey: file.fieldKey, storageKey: file.storageKey, originalFilename: file.originalFilename, mimeType: file.mimeType, sizeBytes: file.sizeBytes })));
      return id;
    });
    try {
      await sendSubmissionNotification({ formKey: form.formKey, submissionId: result.toString(), payload, attachments: saved.map((file) => ({ path: file.absolutePath, filename: file.originalFilename, mimeType: file.mimeType })) });
      try { await db.update(submissions).set({ notificationStatus: "sent", notifiedAt: new Date(), notificationError: null }).where(eq(submissions.id, result)); }
      catch (error) { console.error("[submission:notification-status]", error instanceof Error ? error.message : "unknown error"); }
    } catch (error) {
      console.error("[submission:notification]", error instanceof Error ? error.message : "unknown error");
      try { await db.update(submissions).set({ notificationStatus: "failed", notificationError: "Notification delivery failed" }).where(eq(submissions.id, result)); }
      catch (statusError) { console.error("[submission:notification-status]", statusError instanceof Error ? statusError.message : "unknown error"); }
    }
    return { ok: true, id: result.toString(), successMessage: config.copy.successMessage ?? "Submitted" };
  } catch (error) {
    await Promise.all(saved.map((file) => removeSubmissionFile(file.storageKey)));
    if (/duplicate|unique/i.test(String(error))) return { ok: false, code: "DUPLICATE", message: "Duplicate submission" };
    console.error("[submission]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to submit form" };
  }
}
