import { z } from "zod";

/** Client-safe form transport primitives. Never import the DB or renderer registry here. */
export const FORM_RENDERER_KEYS = ["contact", "join_application", "partner_registration", "generic"] as const;
export const formKeySchema = z.string().trim().regex(/^[a-z][a-z0-9_]{1,99}$/);
export const formDefinitionSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/).optional(), formKey: formKeySchema,
  rendererKey: z.enum(FORM_RENDERER_KEYS), kind: z.enum(["system", "user"]), archived: z.boolean(),
});

/** One allowlist shared by the generic create boundary and registry. */
export const genericFieldTypes = ["text", "email", "phone", "textarea", "select", "radio", "checkbox", "number", "date"] as const;
export const genericValidationPresets = ["validation.fullNameMin", "validation.fullNameMax", "validation.phone", "validation.messageMin", "validation.messageMax", "validation.email", "validation.city", "validation.experience", "validation.transport", "validation.nationalId", "validation.drivingLicense", "validation.fileSize", "validation.fileType", "validation.company"] as const;
export const genericFieldWidths = ["full", "half", "third"] as const;
/** Normalized legacy reads also represent protected built-in file fields. */
export const normalizedFieldTypes = [...genericFieldTypes, "file"] as const;

export const genericFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), type: z.enum(genericFieldTypes),
  label: z.string().trim().min(1).max(255), placeholder: z.string().max(255).optional(), helpText: z.string().max(1000).optional(), validationMessage: z.string().max(500).optional(),
  required: z.boolean().default(false), width: z.enum(genericFieldWidths).default("full"),
  validationPreset: z.enum(genericValidationPresets).nullable().default(null),
  options: z.array(z.string().trim().min(1).max(255)).max(100).optional(),
}).strict().superRefine((field, ctx) => {
  const choice = field.type === "select" || field.type === "radio" || field.type === "checkbox";
  if (choice && (!field.options || field.options.length === 0)) ctx.addIssue({ code: "custom", path: ["options"], message: "Choice fields require options" });
  if (!choice && field.options !== undefined) ctx.addIssue({ code: "custom", path: ["options"], message: "Only choice fields may have options" });
  if (field.options && new Set(field.options).size !== field.options.length) ctx.addIssue({ code: "custom", path: ["options"], message: "Choice options must be unique" });
});

export const genericCreateConfigSchema = z.object({
  fields: z.array(genericFieldSchema).min(1).max(50), submit: z.string().trim().min(1).max(255), success: z.string().trim().min(1).max(1000), error: z.string().max(1000).optional(),
}).strict();
export const bilingualGenericCreateConfigSchema = z.object({ ar: genericCreateConfigSchema, en: genericCreateConfigSchema }).strict();
export const normalizedFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,99}$/), type: z.enum(normalizedFieldTypes), sortOrder: z.number().int().nonnegative(),
  required: z.boolean(), validationPreset: z.string().max(80).nullable(), width: z.enum(genericFieldWidths),
}).strict();
export const formRevisionSchema = z.object({ formId: z.string().regex(/^[1-9]\d*$/), locale: z.enum(["ar", "en"]), revisionToken: z.string().regex(/^[1-9]\d*$/), config: z.unknown() });
export type FormDefinitionInput = z.input<typeof formDefinitionSchema>;
export type FormRevisionInput = z.input<typeof formRevisionSchema>;
