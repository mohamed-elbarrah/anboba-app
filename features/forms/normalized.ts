import { z } from "zod";
/* The validated renderer contracts have heterogeneous nested shapes; these helpers only project paths. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormRendererKey } from "./registry-core";

/** `file` is protected legacy-only: it is readable only on built-in join forms, never generic-created. */
export const normalizedFieldTypes = ["text", "email", "phone", "textarea", "select", "radio", "checkbox", "number", "date", "file"] as const;
export const normalizedWidths = ["full", "half", "third"] as const;
export const normalizedRendererModes = ["legacy", "flexible"] as const;
export const normalizedValidationPresets = ["validation.fullNameMin", "validation.fullNameMax", "validation.phone", "validation.messageMin", "validation.messageMax", "validation.email", "validation.city", "validation.experience", "validation.transport", "validation.nationalId", "validation.drivingLicense", "validation.fileSize", "validation.fileType", "validation.company"] as const;

export const normalizedFieldDefinitionSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,99}$/),
  type: z.enum(normalizedFieldTypes),
  sortOrder: z.number().int().nonnegative(),
  required: z.boolean(),
  validationPreset: z.enum(normalizedValidationPresets).nullable(),
  width: z.enum(normalizedWidths),
}).strict();
export const localizedFieldPropertiesSchema = z.object({
  fieldKey: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,99}$/), locale: z.enum(["ar", "en"]),
  label: z.string().trim().min(1).max(255), placeholder: z.string().max(255).nullable(),
  helpText: z.string().nullable(), validationMessage: z.string().max(500).nullable(),
}).strict();
export const normalizedOptionSchema = z.object({ key: z.string().regex(/^[a-z][a-zA-Z0-9_]{0,99}$/), sortOrder: z.number().int().nonnegative(), label: z.string().trim().min(1).max(255) }).strict();
export const formCopySchema = z.object({ submitLabel: z.string().max(255).nullable(), successMessage: z.string().nullable(), errorMessage: z.string().nullable() }).strict();
export const normalizedRevisionSchema = z.object({
  rendererKey: z.enum(["contact", "join_application", "partner_registration", "generic"]),
  rendererMode: z.enum(normalizedRendererModes), templateKey: z.string().max(100).nullable(),
  fields: z.array(normalizedFieldDefinitionSchema), localizations: z.array(localizedFieldPropertiesSchema),
  options: z.record(z.string(), z.array(normalizedOptionSchema)), copy: formCopySchema,
}).strict();
export type NormalizedFieldDefinition = z.infer<typeof normalizedFieldDefinitionSchema>;
export type LocalizedFieldProperties = z.infer<typeof localizedFieldPropertiesSchema>;
export type NormalizedOption = z.infer<typeof normalizedOptionSchema>;
export type FormCopy = z.infer<typeof formCopySchema>;
export type NormalizedRevision = z.infer<typeof normalizedRevisionSchema>;
export type RuntimeFormConfig = { rendererKey: FormRendererKey; config: unknown };

/**
 * Validate the complete normalized contract at the server boundary.  The
 * database has one localization per field/locale, but the JSON input has no
 * such constraints, so ownership and completeness must be checked here too.
 */
export function validateNormalizedRevision(value: unknown, rendererKey: FormRendererKey, locale: "ar" | "en"): NormalizedRevision {
  const revision = normalizedRevisionSchema.parse(value);
  if (revision.rendererKey !== rendererKey) throw new Error("Normalized renderer ownership mismatch");
  const fieldKeys = new Set<string>();
  const sortOrders = new Set<number>();
  for (const field of revision.fields) {
    if (fieldKeys.has(field.key)) throw new Error(`Duplicate normalized field: ${field.key}`);
    if (sortOrders.has(field.sortOrder)) throw new Error(`Duplicate normalized field order: ${field.sortOrder}`);
    fieldKeys.add(field.key); sortOrders.add(field.sortOrder);
    if (field.type === "file" && rendererKey !== "join_application") throw new Error("File fields are protected to the join application");
  }
  if (revision.localizations.length !== revision.fields.length) throw new Error("Normalized field localization coverage is incomplete");
  const localizedKeys = new Set<string>();
  for (const localization of revision.localizations) {
    if (localization.locale !== locale) throw new Error("Normalized field localization has the wrong locale");
    if (!fieldKeys.has(localization.fieldKey) || localizedKeys.has(localization.fieldKey)) throw new Error("Normalized field localization ownership is invalid");
    localizedKeys.add(localization.fieldKey);
  }
  if (localizedKeys.size !== fieldKeys.size) throw new Error("Normalized field localization coverage is incomplete");
  const optionKeys = Object.keys(revision.options);
  if (optionKeys.length !== fieldKeys.size || optionKeys.some((key) => !fieldKeys.has(key))) throw new Error("Normalized option ownership is invalid");
  for (const field of revision.fields) {
    const options = revision.options[field.key];
    const choice = field.type === "select" || field.type === "radio" || field.type === "checkbox";
    if (choice !== (options.length > 0)) throw new Error(`Invalid options for normalized field: ${field.key}`);
    const keys = new Set<string>(); const orders = new Set<number>();
    for (const option of options) {
      if (keys.has(option.key) || orders.has(option.sortOrder)) throw new Error(`Duplicate normalized option: ${field.key}`);
      keys.add(option.key); orders.add(option.sortOrder);
    }
  }
  return revision;
}

const fieldMaps = {
  contact: [
    ["fullName", "text", "fields.fullName", "placeholders.fullName", "validation.fullNameMin", true], ["phone", "phone", "fields.phone", "placeholders.phone", "validation.phone", true], ["message", "textarea", "fields.message", "placeholders.message", "validation.messageMin", true],
  ],
  join_application: [
    ["fullName", "text", "fields.fullName", "placeholders.fullName", "validation.fullNameMin", true], ["phone", "phone", "fields.phone", "placeholders.phone", "validation.phone", true], ["email", "email", "fields.email", "placeholders.email", "validation.email", true], ["city", "text", "fields.city", "placeholders.city", "validation.city", true], ["experienceYears", "select", "fields.experienceYears", "selectPlaceholders.experienceYears", "validation.experience", true], ["transportType", "select", "fields.transportType", "selectPlaceholders.transportType", "validation.transport", true], ["nationalId", "file", "fields.nationalId", null, "validation.nationalId", true], ["drivingLicense", "file", "fields.drivingLicense", null, "validation.drivingLicense", true],
  ],
  partner_registration: [
    ["company", "text", "fields.company", "placeholders.company", "validation.company", true], ["phone", "phone", "fields.phone", "placeholders.phone", "validation.phone", true], ["email", "email", "fields.email", "placeholders.email", "validation.email", false], ["city", "select", "fields.city", "placeholders.city", "validation.city", true],
  ],
  generic: [],
} as const;
const get = (value: any, path: string | null) => path?.split(".").reduce((v, k) => v?.[k], value);
export function normalizedFromConfig(rendererKey: FormRendererKey, config: any, locale: "ar" | "en"): NormalizedRevision {
  // Flexible built-in revisions persist the submitted normalized contract as
  // their source of truth. Never rebuild these from the template, otherwise
  // editor changes are silently discarded.
  if (config?.rendererKey === rendererKey && config?.rendererMode === "flexible") {
    return validateNormalizedRevision({ ...config, rendererKey, rendererMode: "flexible" }, rendererKey, locale);
  }
  const maps = fieldMaps[rendererKey];
  const fields = maps.length ? maps.map(([key, type, , , validation, required], i) => ({ key, type, sortOrder: i, required, validationPreset: validation, width: "full" as const })) : (config.fields ?? []).map((f: any, i: number) => ({ key: f.key, type: f.type, sortOrder: i, required: Boolean(f.required), validationPreset: f.validationPreset ?? null, width: f.width ?? "full" }));
  const localizations = maps.length ? maps.map(([key, , labelPath, placeholderPath, validationPath]) => ({ fieldKey: key, locale, label: get(config, labelPath) ?? key, placeholder: get(config, placeholderPath) ?? null, helpText: null, validationMessage: get(config, validationPath) ?? null })) : (config.fields ?? []).map((f: any) => ({ fieldKey: f.key, locale, label: f.label, placeholder: f.placeholder ?? null, helpText: f.helpText ?? null, validationMessage: f.validationMessage ?? null }));
  const options: Record<string, NormalizedOption[]> = {};
  if (rendererKey === "join_application") { options.experienceYears = config.experienceOptions.map((label: string, i: number) => ({ key: `option_${i + 1}`, sortOrder: i, label })); options.transportType = config.transportOptions.map((label: string, i: number) => ({ key: `option_${i + 1}`, sortOrder: i, label })); }
  if (rendererKey === "partner_registration") options.city = config.cityOptions.map((label: string, i: number) => ({ key: `option_${i + 1}`, sortOrder: i, label }));
  if (rendererKey === "generic") for (const f of config.fields ?? []) if (f.options) options[f.key] = f.options.map((item: string | { key: string; label: string }, i: number) => typeof item === "string" ? ({ key: `option_${i + 1}`, sortOrder: i, label: item }) : ({ key: item.key, sortOrder: i, label: item.label }));
  for (const field of fields) options[field.key] ??= [];
  return validateNormalizedRevision({ rendererKey, rendererMode: rendererKey === "generic" ? "flexible" : "legacy", templateKey: rendererKey, fields, localizations, options, copy: { submitLabel: config.submit ?? null, successMessage: config.success ?? null, errorMessage: config.error ?? null } }, rendererKey, locale);
}
export { get as getNormalizedValue };
