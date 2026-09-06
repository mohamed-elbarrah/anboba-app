import { normalizedRevisionSchema, validateNormalizedRevision, type NormalizedRevision, type NormalizedFieldDefinition } from "./normalized";

/** Client-safe, render-ready projection. No database rows or executable values cross this boundary. */
export type PublicFormField = NormalizedFieldDefinition & {
  label: string;
  placeholder: string | null;
  helpText: string | null;
  validationMessage: string | null;
  options: ReadonlyArray<{ key: string; label: string }>;
};
export type PublicFlexibleForm = {
  fields: PublicFormField[];
  submitLabel: string;
  successMessage: string;
  errorMessage: string | null;
};

/** Normalize and validate the persisted projection before it reaches a client component. */
export function adaptNormalizedForm(value: unknown, locale: "ar" | "en" = "ar"): PublicFlexibleForm | null {
  // The server repository may attach a private legacy projection for dashboard
  // compatibility. It is not part of the strict flexible renderer contract and
  // must never cross into that schema (or into the client component).
  const flexibleInput = value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== "legacyConfig"))
    : value;
  const parsed = normalizedRevisionSchema.safeParse(flexibleInput);
  if (!parsed.success || parsed.data.rendererMode !== "flexible") return null;
  let revision: NormalizedRevision;
  try { revision = validateNormalizedRevision(parsed.data, parsed.data.rendererKey, locale); } catch { return null; }
  const byKey = new Map(revision.localizations.map((item) => [item.fieldKey, item]));
  const fields: PublicFormField[] = [];
  for (const field of revision.fields.sort((a, b) => a.sortOrder - b.sortOrder)) {
    // File is presentation-only and remains available only on the protected
    // join application. It is never submitted, uploaded, or persisted.
    if (field.type === "file" && revision.rendererKey !== "join_application") return null;
    const copy = byKey.get(field.key);
    if (!copy) return null;
    const options = revision.options[field.key] ?? [];
    const choice = field.type === "select" || field.type === "radio" || field.type === "checkbox";
    if (choice && options.length === 0) return null;
    if (!choice && field.type !== "file" && options.length > 0) return null;
    fields.push({ ...field, label: copy.label, placeholder: copy.placeholder, helpText: copy.helpText, validationMessage: copy.validationMessage, options });
  }
  if (!fields.length || !revision.copy.submitLabel || !revision.copy.successMessage) return null;
  return { fields, submitLabel: revision.copy.submitLabel, successMessage: revision.copy.successMessage, errorMessage: revision.copy.errorMessage };
}

export function isFlexibleForm(value: unknown, locale: "ar" | "en" = "ar"): value is NormalizedRevision {
  return adaptNormalizedForm(value, locale) !== null;
}
