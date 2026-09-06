import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { drizzle } from "drizzle-orm/mysql2";
import { and, asc, eq, inArray } from "drizzle-orm";
import * as schema from "../db/schema";
import { closePool, getPool } from "../db/connection";
import { getDb } from "../db";
import { forms, formRevisions, formRevisionFields, formFieldLocalizations, formFieldOptions, formFieldOptionLocalizations, formRevisionCopy, pageSections, pageRevisions, pageRevisionPointers, pages } from "../db/schema";
import { parseFormConfig, type BuiltInFormKey } from "../features/forms/registry-core";
import { normalizedFromConfig } from "../features/forms/normalized";
import { writeNormalizedRevision } from "../features/forms/normalization";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";

const mappings: Record<BuiltInFormKey, { slug: string; section: "contact" | "join_application" | "partner_registration" }> = { contact: { slug: "contact", section: "contact" }, join_application: { slug: "", section: "join_application" }, partner_registration: { slug: "join-us", section: "partner_registration" } };
const report = { forms: 0, revisions: 0, normalized: 0, alreadyNormalized: 0, sectionsChecked: 0, sectionsLinked: 0 };
function canonical(value: unknown): unknown { if (typeof value === "bigint") return String(value); if (Array.isArray(value)) return value.map(canonical); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])); return value; }
function same(a: unknown, b: unknown) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type PageSnapshot = { pages: unknown; revisions: unknown; pointers: unknown; sections: unknown };
async function pageSnapshot(tx: Tx): Promise<PageSnapshot> {
  return { pages: await tx.select().from(pages), revisions: await tx.select().from(pageRevisions), pointers: await tx.select().from(pageRevisionPointers), sections: (await tx.select().from(pageSections)).map((section) => { const { formId, ...rest } = section; void formId; return rest; }) };
}
async function verifyProjection(tx: Tx, revision: typeof formRevisions.$inferSelect, key: BuiltInFormKey) {
  const expected = normalizedFromConfig(key, revision.configJson, revision.locale);
  if ((revision.rendererMode !== null && revision.rendererMode !== expected.rendererMode) || (revision.templateKey !== null && revision.templateKey !== expected.templateKey)) throw new Error(`Renderer metadata mismatch revision=${revision.id}`);
  if (revision.rendererMode === null || revision.templateKey === null) await tx.update(formRevisions).set({ rendererMode: expected.rendererMode, templateKey: expected.templateKey }).where(eq(formRevisions.id, revision.id));
  const fields = await tx.select().from(formRevisionFields).where(eq(formRevisionFields.revisionId, revision.id)).orderBy(asc(formRevisionFields.sortOrder));
  if (!fields.length) {
    const [orphanLocs, orphanCopies] = await Promise.all([
      tx.select({ id: formFieldLocalizations.fieldId }).from(formFieldLocalizations).where(eq(formFieldLocalizations.revisionId, revision.id)),
      tx.select({ id: formRevisionCopy.revisionId }).from(formRevisionCopy).where(eq(formRevisionCopy.revisionId, revision.id)),
    ]);
    if (orphanLocs.length || orphanCopies.length) throw new Error(`Orphan normalized rows revision=${revision.id}`);
    await writeNormalizedRevision(tx, revision.id, key, revision.locale, revision.configJson); report.normalized++; return;
  }
  if (fields.length !== expected.fields.length || fields.some((f, i) => !same({ key: f.fieldKey, type: f.fieldType, sortOrder: f.sortOrder, required: f.required, validationPreset: f.validationPreset, width: f.width }, expected.fields[i]))) throw new Error(`Normalized field mismatch revision=${revision.id}`);
  const ids = fields.map((f) => f.id);
  const [locs, opts, optLocs, copies] = await Promise.all([tx.select().from(formFieldLocalizations).where(and(eq(formFieldLocalizations.revisionId, revision.id), eq(formFieldLocalizations.locale, revision.locale))), tx.select().from(formFieldOptions).where(inArray(formFieldOptions.fieldId, ids)).orderBy(asc(formFieldOptions.sortOrder)), tx.select().from(formFieldOptionLocalizations).where(inArray(formFieldOptionLocalizations.fieldId, ids)), tx.select().from(formRevisionCopy).where(eq(formRevisionCopy.revisionId, revision.id))]);
  if (locs.length !== fields.length || copies.length !== 1) throw new Error(`Partial normalized rows revision=${revision.id}`);
  const expectedOptionCount = Object.values(expected.options).reduce((count, items) => count + items.length, 0);
  if (opts.length !== expectedOptionCount || optLocs.length !== expectedOptionCount) throw new Error(`Orphan/extra normalized option rows revision=${revision.id}`);
  for (const field of expected.fields) { const index = fields.findIndex((f) => f.fieldKey === field.key); const loc = locs.find((l) => l.fieldId === fields[index].id); const want = expected.localizations.find((l) => l.fieldKey === field.key); if (!loc || !want || !same({ label: loc.label, placeholder: loc.placeholder, helpText: loc.helpText, validationMessage: loc.validationMessage }, { label: want.label, placeholder: want.placeholder, helpText: want.helpText, validationMessage: want.validationMessage })) throw new Error(`Normalized localization mismatch revision=${revision.id} field=${field.key}`); const gotOptions = opts.filter((o) => o.fieldId === fields[index].id).map((o) => ({ key: o.optionKey, sortOrder: o.sortOrder, label: optLocs.find((l) => l.optionId === o.id && l.locale === revision.locale)?.label ?? "" })); if (!same(gotOptions, expected.options[field.key] ?? [])) throw new Error(`Normalized options mismatch revision=${revision.id} field=${field.key}`); }
  const copy = copies[0]; if (!copy || !same({ submitLabel: copy.submitLabel, successMessage: copy.successMessage, errorMessage: copy.errorMessage }, expected.copy)) throw new Error(`Normalized copy mismatch revision=${revision.id}`);
  report.alreadyNormalized++;
}
async function migrate() {
  const connection = await getPool().getConnection(); const db = drizzle(connection, { schema, mode: "default" }); let locked = false;
  try { await acquireDataLock(connection); locked = true; await db.transaction(async (tx) => {
    const beforePages = await pageSnapshot(tx);
    for (const key of Object.keys(mappings).sort() as BuiltInFormKey[]) { const mapping = mappings[key]; const formRows = await tx.select().from(forms).where(and(eq(forms.formKey, key), eq(forms.kind, "system"), eq(forms.archived, false))); if (formRows.length !== 1) throw new Error(`Expected one active built-in form: ${key}`); const form = formRows[0]; if (form.rendererKey !== key) throw new Error(`Renderer mismatch form=${key}`); report.forms++;
      const revisions = await tx.select().from(formRevisions).where(eq(formRevisions.formId, form.id)).orderBy(asc(formRevisions.id)); for (const revision of revisions) { parseFormConfig(key, revision.configJson); await verifyProjection(tx, revision, key); report.revisions++; }
      for (const locale of ["ar", "en"] as const) { const page = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, mapping.slug))).limit(1))[0]; if (!page) throw new Error(`Missing page ${locale}:${mapping.slug || "home"}`); const pageRows = await tx.select({ id: pageSections.id, formId: pageSections.formId }).from(pageSections).innerJoin(pageRevisions, eq(pageSections.revisionId, pageRevisions.id)).where(and(eq(pageRevisions.pageId, page.id), eq(pageSections.sectionKey, mapping.section))); for (const section of pageRows) { report.sectionsChecked++; if (section.formId !== null && section.formId !== form.id) throw new Error(`Form reference mismatch section=${section.id}`); if (section.formId === null) { await tx.update(pageSections).set({ formId: form.id }).where(eq(pageSections.id, section.id)); report.sectionsLinked++; } } }
    }
    const afterPages = await pageSnapshot(tx);
    if (!same(beforePages, afterPages)) throw new Error("Page content, revisions, pointers, or non-form section data changed during normalization; only page_sections.form_id references may change");
  }); } finally { if (locked) await releaseDataLock(connection); connection.release(); }
  console.log(`[forms-normalized-migration] forms=${report.forms} revisions=${report.revisions} normalized=${report.normalized} alreadyNormalized=${report.alreadyNormalized} sectionsChecked=${report.sectionsChecked} sectionsLinked=${report.sectionsLinked}`);
}
migrate().catch((error) => { console.error("[forms-normalized-migration] refused/failed", error); process.exitCode = 1; }).finally(() => closePool());
