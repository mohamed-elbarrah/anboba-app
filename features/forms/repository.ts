/* Safe for both server actions and CLI verification; callers keep this module server-side. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { formFieldLocalizations, formFieldOptionLocalizations, formFieldOptions, formRevisionCopy, formRevisionFields, formRevisions } from "@/db/schema";
import { normalizedFromConfig, validateNormalizedRevision, type NormalizedRevision } from "./normalized";
import { parseFormConfig, type FormRendererKey } from "./registry-core";

/** Complete normalized runtime data. It is deliberately separate from the legacy renderer config. */
export type NormalizedRuntimeRevision = NormalizedRevision & { legacyConfig: unknown | null };
function fail(message: string): never { throw new Error(`[forms:normalized] ${message}`); }
function canonical(value: unknown): unknown { if (typeof value === "bigint") return String(value); if (Array.isArray(value)) return value.map(canonical); if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value as object).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])); return value; }
function sameJson(left: unknown, right: unknown) { return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right)); }

type QueryDatabase = ReturnType<typeof getDb>;
export async function readNormalizedRevision(row: typeof formRevisions.$inferSelect, rendererKey: FormRendererKey, database?: QueryDatabase): Promise<NormalizedRuntimeRevision> {
  const db = database ?? getDb();
  const fields = await db.select().from(formRevisionFields).where(eq(formRevisionFields.revisionId, row.id)).orderBy(asc(formRevisionFields.sortOrder));
  if (!fields.length) fail(`revision ${row.id} has no normalized fields; legacy fallback requires an explicit compatibility read`);
  const ids = fields.map((field) => field.id);
  const [locs, opts, optLocs, copies] = await Promise.all([
    db.select().from(formFieldLocalizations).where(and(eq(formFieldLocalizations.revisionId, row.id), eq(formFieldLocalizations.locale, row.locale))),
    db.select().from(formFieldOptions).where(inArray(formFieldOptions.fieldId, ids)).orderBy(asc(formFieldOptions.sortOrder)),
    db.select().from(formFieldOptionLocalizations).where(inArray(formFieldOptionLocalizations.fieldId, ids)),
    db.select().from(formRevisionCopy).where(eq(formRevisionCopy.revisionId, row.id)),
  ]);
  const allLocs = await db.select().from(formFieldLocalizations).where(inArray(formFieldLocalizations.fieldId, ids));
  if (copies.length !== 1 || allLocs.length !== fields.length || locs.length !== fields.length || allLocs.some((item) => item.revisionId !== row.id || item.locale !== row.locale)) fail(`revision ${row.id} has incomplete or cross-locale field localizations`);
  const fieldIds = new Set(fields.map((field) => field.id.toString()));
  const locById = new Map(locs.map((item) => [item.fieldId.toString(), item]));
  if (locs.some((item) => !fieldIds.has(item.fieldId.toString())) || locs.length !== fields.length) fail(`revision ${row.id} has extra field localizations`);
  if (optLocs.length !== opts.length || optLocs.some((item) => item.locale !== row.locale || !fieldIds.has(item.fieldId.toString()))) fail(`revision ${row.id} has incomplete or cross-locale option localizations`);
  const optionIds = new Set(opts.map((option) => option.id.toString()));
  if (optLocs.some((item) => !optionIds.has(item.optionId.toString()) || !opts.some((option) => option.id === item.optionId && option.fieldId === item.fieldId))) fail(`revision ${row.id} has option localization ownership errors`);
  const optionLocById = new Map(optLocs.map((item) => [item.optionId.toString(), item.label]));
  const normalized: NormalizedRevision = validateNormalizedRevision({
    rendererKey, rendererMode: row.rendererMode, templateKey: row.templateKey,
    fields: fields.map((field) => ({ key: field.fieldKey, type: field.fieldType, sortOrder: field.sortOrder, required: field.required, validationPreset: field.validationPreset, width: field.width })),
    localizations: fields.map((field) => { const loc = locById.get(field.id.toString()); if (!loc) fail(`missing localization for ${field.fieldKey}`); return { fieldKey: field.fieldKey, locale: row.locale, label: loc.label, placeholder: loc.placeholder, helpText: loc.helpText, validationMessage: loc.validationMessage }; }),
    options: Object.fromEntries(fields.map((field) => { const optionRows = opts.filter((option) => option.fieldId === field.id); const choice = field.fieldType === "select" || field.fieldType === "radio" || field.fieldType === "checkbox"; if (choice && !optionRows.length) fail(`missing options for ${field.fieldKey}`); if (!choice && optionRows.length) fail(`unexpected options for ${field.fieldKey}`); return [field.fieldKey, optionRows.map((option) => { const label = optionLocById.get(option.id.toString()); if (label === undefined) fail(`missing option localization for ${field.fieldKey}/${option.optionKey}`); return { key: option.optionKey, sortOrder: option.sortOrder, label }; })]; })),
    copy: { submitLabel: copies[0].submitLabel, successMessage: copies[0].successMessage, errorMessage: copies[0].errorMessage },
  }, rendererKey, row.locale);
  // Legacy projection is intentionally available only to an exact, unchanged built-in projection.
  let legacyConfig: unknown | null = null;
  if (rendererKey !== "generic" && row.rendererMode === "legacy") {
    const expected = normalizedFromConfig(rendererKey, row.configJson, row.locale);
    if (!sameJson(normalized, expected)) fail(`revision ${row.id} normalized data differs from its legacy source; refusing compatibility projection`);
    legacyConfig = projectLegacyConfig(row, rendererKey, normalized);
  }
  return { ...normalized, legacyConfig };
}

const paths: Record<string, { label: string; placeholder?: string; validation?: string; options?: string }> = {
  fullName: { label: "fields.fullName", placeholder: "placeholders.fullName", validation: "validation.fullNameMin" }, phone: { label: "fields.phone", placeholder: "placeholders.phone", validation: "validation.phone" }, message: { label: "fields.message", placeholder: "placeholders.message", validation: "validation.messageMin" }, email: { label: "fields.email", placeholder: "placeholders.email", validation: "validation.email" }, city: { label: "fields.city", placeholder: "placeholders.city", validation: "validation.city" }, company: { label: "fields.company", placeholder: "placeholders.company", validation: "validation.company" }, experienceYears: { label: "fields.experienceYears", placeholder: "selectPlaceholders.experienceYears", options: "experienceOptions" }, transportType: { label: "fields.transportType", placeholder: "selectPlaceholders.transportType", options: "transportOptions" }, nationalId: { label: "fields.nationalId", validation: "validation.nationalId" }, drivingLicense: { label: "fields.drivingLicense", validation: "validation.drivingLicense" },
};
function setPath(target: Record<string, any>, path: string | undefined, value: unknown) { if (!path) return; const parts = path.split("."); let cursor = target; for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {}; cursor[parts.at(-1)!] = value; }
function projectLegacyConfig(row: typeof formRevisions.$inferSelect, key: Exclude<FormRendererKey, "generic">, normalized: NormalizedRevision) {
  const config = structuredClone(row.configJson) as Record<string, any>;
  for (const field of normalized.fields) { const loc = normalized.localizations.find((item) => item.fieldKey === field.key); const path = paths[field.key]; if (loc && path) { setPath(config, path.label, loc.label); setPath(config, path.placeholder, loc.placeholder); if (loc.validationMessage) setPath(config, path.validation, loc.validationMessage); } if (path?.options) setPath(config, path.options, (normalized.options[field.key] ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.label)); }
  if ("submit" in config) config.submit = normalized.copy.submitLabel ?? config.submit;
  if ("success" in config) config.success = normalized.copy.successMessage ?? config.success;
  return parseFormConfig(key, config);
}

/** Compatibility API: built-ins get their unchanged specialized config; generic forms get structural data. */
export async function runtimeConfigForRevision(row: typeof formRevisions.$inferSelect, rendererKey: FormRendererKey, database?: QueryDatabase) {
  const normalized = await readNormalizedRevision(row, rendererKey, database);
  // Structural edits to a built-in deliberately switch to the controlled renderer.
  if (rendererKey === "generic" || row.rendererMode === "flexible") return normalized;
  if (!normalized.legacyConfig) fail(`revision ${row.id} is flexible and has no public legacy renderer`);
  return normalized.legacyConfig;
}
