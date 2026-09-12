import "server-only";

import { z } from "zod";

export const emailAddressSchema = z.string().trim().max(320).email().transform((value) => value.toLowerCase());

/** The only values template authors may insert into a notification. */
export const submissionNotificationPlaceholders = [
  "senderName",
  "formName",
  "submissionId",
  "submittedAt",
] as const;
const allowedPlaceholders = new Set(submissionNotificationPlaceholders);
// LF is intentionally allowed for the plain-text body; all other controls are rejected.
const controlCharacters = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/;

function templateText(max: number, allowLineBreaks = false) {
  return z.string().trim().min(1).max(max).refine((value) => {
    if (controlCharacters.test(value) || (!allowLineBreaks && /[\r\n]/.test(value))) return false;
    const matches = [...value.matchAll(/\{\{([^{}]*)\}\}/g)];
    if (matches.some((match) => !allowedPlaceholders.has(match[1] as typeof submissionNotificationPlaceholders[number]))) return false;
    // Do not let malformed delimiters through as literal/template ambiguity.
    const remainder = matches.reduce((text, match) => text.replace(match[0], ""), value);
    return !remainder.includes("{{") && !remainder.includes("}}");
  }, "Invalid notification template");
}

export const submissionNotificationTemplateSchema = z.object({
  subject: templateText(255),
  body: templateText(5000, true),
}).strict();

export const submissionNotificationFormKeySchema = z.enum([
  "contact",
  "join_application",
  "partner_registration",
]);

/** One global setting containing exactly the three built-in Arabic templates. */
export const submissionNotificationTemplatesSchema = z.object({
  contact: submissionNotificationTemplateSchema,
  join_application: submissionNotificationTemplateSchema,
  partner_registration: submissionNotificationTemplateSchema,
}).strict();

export const submissionNotificationTemplateInputSchema = z.object({
  formKey: submissionNotificationFormKeySchema,
  template: submissionNotificationTemplateSchema,
}).strict();

/** The existing recipient setting remains separate and unchanged. */
export const submissionNotificationRecipientSchema = z.object({
  recipientEmail: emailAddressSchema,
}).strict();

export const submissionNotificationRecipientInputSchema = z.object({
  recipientEmail: emailAddressSchema,
}).strict();

export type SubmissionNotificationRecipient = z.infer<typeof submissionNotificationRecipientSchema>;
export type SubmissionNotificationTemplate = z.infer<typeof submissionNotificationTemplateSchema>;
export type SubmissionNotificationTemplates = z.infer<typeof submissionNotificationTemplatesSchema>;
export type SubmissionNotificationFormKey = z.infer<typeof submissionNotificationFormKeySchema>;
