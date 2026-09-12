import "server-only";

import nodemailer from "nodemailer";
import { z } from "zod";
import { getSubmissionNotificationRecipient, getSubmissionNotificationTemplates } from "@/features/settings/queries";
import type { SubmissionNotificationFormKey, SubmissionNotificationTemplate } from "@/features/settings/notification-schema";
import { emailAddressSchema } from "@/features/settings/notification-schema";

const smtpConfigSchema = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65_535),
  secure: z.enum(["true", "false"]).transform((value) => value === "true"),
  user: emailAddressSchema,
  password: z.string().min(1),
  from: emailAddressSchema,
}).strict();

function smtpConfig() {
  const parsed = smtpConfigSchema.safeParse({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ?? "465",
    secure: process.env.SMTP_SECURE ?? "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  });
  if (!parsed.success) throw new Error("SMTP is not configured");
  return parsed.data;
}

function normalizedEmail(value: unknown) {
  const parsed = emailAddressSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function createTransport(config: z.infer<typeof smtpConfigSchema>) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth: { user: config.user, pass: config.password },
  });
}

async function sendMail(input: { to: string; subject: string; text: string }) {
  const config = smtpConfig();
  const to = normalizedEmail(input.to);
  if (!to) throw new Error("SMTP is not configured");
  await createTransport(config).sendMail({ from: config.from, to, subject: input.subject, text: input.text });
}

function renderNotificationTemplate(template: SubmissionNotificationTemplate, values: Record<string, string>) {
  const interpolate = (text: string) => text.replace(/\{\{(senderName|formName|submissionId|submittedAt)\}\}/g, (_, key: string) => values[key] ?? "");
  return { subject: interpolate(template.subject), text: interpolate(template.body) };
}

export async function sendSubmissionTestEmail(recipient: string, formKey: SubmissionNotificationFormKey, template?: SubmissionNotificationTemplate) {
  const to = normalizedEmail(recipient);
  if (!to) throw new Error("Invalid notification recipient");
  const formName = submissionNotificationFormLabel(formKey);
  const rendered = renderNotificationTemplate(template ?? (await getSubmissionNotificationTemplates())[formKey], {
    senderName: "معاينة آمنة",
    formName,
    submissionId: "TEST",
    submittedAt: new Date().toISOString(),
  });
  await sendMail({ to, subject: rendered.subject, text: rendered.text });
}

const senderFieldByForm: Record<string, string> = {
  contact: "fullName",
  join_application: "fullName",
  partner_registration: "company",
};

function safeNotificationValue(value: unknown, fallback: string, maxLength = 120) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, maxLength);
  return cleaned || fallback;
}

export function submissionNotificationSender(formKey: string, payload: unknown) {
  const field = senderFieldByForm[formKey];
  const value = field && typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)[field]
    : undefined;
  return safeNotificationValue(value, "غير معروف");
}

export function submissionNotificationFormLabel(formKey: string) {
  const labels: Record<string, string> = {
    contact: "نموذج التواصل",
    join_application: "طلب الانضمام",
    partner_registration: "تسجيل الشركاء",
  };
  return safeNotificationValue(labels[formKey], "النموذج");
}

export async function sendSubmissionNotification(input: {
  formKey: string;
  submissionId: string;
  senderName?: unknown;
  submittedAt?: Date;
}) {
  const to = await getSubmissionNotificationRecipient();
  if (!to) throw new Error("SMTP is not configured");
  const senderName = safeNotificationValue(input.senderName, "غير معروف");
  const formLabel = submissionNotificationFormLabel(input.formKey);
  const submissionId = safeNotificationValue(input.submissionId, "غير متاح", 128);
  const timestamp = safeNotificationValue((input.submittedAt ?? new Date()).toISOString(), "غير متاح", 40);
  const template = (await getSubmissionNotificationTemplates())[input.formKey as SubmissionNotificationFormKey] ?? {
    subject: "إرسال جديد عبر {{formName}}",
    body: "لديك إرسال جديد من {{senderName}} عبر {{formName}}.\nيمكنك الاطلاع على التفاصيل من لوحة التحكم.\n\nمعرّف الإرسال: {{submissionId}}\nوقت الإرسال: {{submittedAt}}",
  };
  const rendered = renderNotificationTemplate(template, {
    senderName,
    formName: formLabel,
    submissionId,
    submittedAt: timestamp,
  });
  await sendMail({ to, subject: rendered.subject, text: rendered.text });
}
