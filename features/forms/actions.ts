'use server';

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { formRevisionPointers, formRevisions, forms, pageRevisions, pageSections, pages } from "@/db/schema";
import { isLocale } from "@/lib/locales";
import { formRevisionSchema, bilingualGenericCreateConfigSchema } from "./schema";
import { isBuiltInFormKey, parseFormConfig } from "./registry";
import { normalizedFromConfig, validateNormalizedRevision } from "./normalized";
import { writeNormalizedRevision } from "./normalization";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Result = { ok: true; revisionToken: string; status: "draft" | "published" } | { ok: false; code: string; message: string };
const authRequired = { ok: false, code: "AUTH_REQUIRED", message: "Authentication is required for form mutations" } as const;
function mutationsAllowed() { return process.env.NODE_ENV !== "production"; }
const invalid = { ok: false, code: "INVALID_INPUT", message: "Invalid form request" } as const;
const notFound = { ok: false, code: "NOT_FOUND", message: "Form revision was not found" } as const;
const stale = { ok: false, code: "STALE_REVISION", message: "The form draft is out of date" } as const;

const createFormInput = z.object({
  // This is a human-provided seed only; it is never treated as a renderer or code value.
  name: z.string().trim().max(80).optional(),
  formKey: z.string().trim().max(80).optional(),
  rendererKey: z.literal("generic").optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
  config: bilingualGenericCreateConfigSchema,
}).strict();
export type CreateFormResult =
  | { ok: true; formId: string; formKey: string; rendererKey: "generic" }
  | { ok: false; code: "INVALID_INPUT" | "INVALID_CONFIG" | "FORM_KEY_CONFLICT" | "INTERNAL_ERROR" | "AUTH_REQUIRED"; message: string };

function formKeyBase(value: string | undefined) {
  const ascii = (value ?? "generic_form").normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  const safe = (ascii || "generic_form").slice(0, 80);
  return safe.startsWith("generic_") ? safe : `generic_${safe}`;
}

async function target(tx: Tx, input: z.infer<typeof formRevisionSchema>) {
  const formId = BigInt(input.formId);
  const form = (await tx.select().from(forms).where(eq(forms.id, formId)).limit(1))[0];
  if (!form || form.archived || !isLocale(input.locale)) return null;
  const pointer = (await tx.select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, formId), eq(formRevisionPointers.locale, input.locale))).limit(1).for("update"))[0];
  if (!pointer?.draftRevisionId) return null;
  if (pointer.draftRevisionId.toString() !== input.revisionToken) return "stale" as const;
  const draft = (await tx.select().from(formRevisions).where(and(eq(formRevisions.id, pointer.draftRevisionId), eq(formRevisions.formId, formId), eq(formRevisions.locale, input.locale), eq(formRevisions.status, "draft"))).limit(1))[0];
  return draft ? { form, pointer, draft } : null;
}
async function nextNumber(tx: Tx, formId: bigint, locale: "ar" | "en") {
  const row = await tx.select({ value: max(formRevisions.revisionNumber) }).from(formRevisions).where(and(eq(formRevisions.formId, formId), eq(formRevisions.locale, locale)));
  return Number(row[0]?.value ?? 0) + 1;
}
async function insertRevision(tx: Tx, formId: bigint, locale: "ar" | "en", config: unknown, status: "draft" | "published", number: number, rendererMode?: "legacy" | "flexible") {
  const form = (await tx.select().from(forms).where(eq(forms.id, formId)).limit(1))[0];
  if (!form) throw new Error("Form not found");
  const mode = rendererMode ?? (form.rendererKey === "generic" ? "flexible" : "legacy");
  const result = await tx.insert(formRevisions).values({ formId, locale, configJson: config, status, revisionNumber: number, rendererMode: mode, templateKey: mode === "legacy" ? form.rendererKey : null });
  const revisionId = BigInt(result[0].insertId);
  await writeNormalizedRevision(tx, revisionId, form.rendererKey, locale, config);
  return revisionId;
}
function parseInput(input: unknown) {
  const parsed = formRevisionSchema.safeParse(input);
  if (!parsed.success || !isLocale(parsed.data.locale)) return null;
  return parsed.data;
}
function submittedConfig(rendererKey: typeof forms.$inferSelect.rendererKey, value: z.infer<typeof formRevisionSchema>) {
  // The editor's generic contract is already normalized. Validate it directly
  // so fields, locale-owned copy, options, and renderer ownership are preserved
  // instead of being reparsed as the legacy generic config shape.
  if (rendererKey === "generic") {
    const normalized = validateNormalizedRevision(value.config, "generic", value.locale);
    return { config: normalized, mode: "flexible" as const };
  }
  // Built-ins retain compatibility with their template config until a
  // structural edit explicitly switches them to the controlled flexible mode.
  if (typeof value.config === "object" && value.config !== null && (value.config as { rendererMode?: unknown }).rendererMode === "flexible") {
    const normalized = validateNormalizedRevision(value.config, rendererKey, value.locale);
    return { config: normalized, mode: "flexible" as const };
  }
  return { config: parseFormConfig(rendererKey, value.config), mode: "legacy" as const };
}
function compatibleLocales(a: ReturnType<typeof validateNormalizedRevision>, b: ReturnType<typeof validateNormalizedRevision>) {
  return JSON.stringify(a.fields.map(({ key, type, sortOrder, required, validationPreset, width }) => ({ key, type, sortOrder, required, validationPreset, width }))) === JSON.stringify(b.fields.map(({ key, type, sortOrder, required, validationPreset, width }) => ({ key, type, sortOrder, required, validationPreset, width }))) && a.fields.every(field => (a.options[field.key] ?? []).map(option => option.key).join("|") === (b.options[field.key] ?? []).map(option => option.key).join("|"));
}
async function ensureBilingualPublish(tx: Tx, formId: bigint, locale: "ar" | "en", submitted: unknown) {
  const other: "ar" | "en" = locale === "ar" ? "en" : "ar";
  const pointer = (await tx.select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, formId), eq(formRevisionPointers.locale, other))).limit(1))[0];
  if (!pointer?.draftRevisionId) throw new Error("BILINGUAL_REQUIRED");
  const row = (await tx.select().from(formRevisions).where(and(eq(formRevisions.id, pointer.draftRevisionId), eq(formRevisions.formId, formId), eq(formRevisions.locale, other), eq(formRevisions.status, "draft"))).limit(1))[0];
  if (!row) throw new Error("BILINGUAL_REQUIRED");
  const current = validateNormalizedRevision(submitted, "generic", locale);
  // Older generic revisions may still have the legacy JSON source shape. Read
  // those through the compatibility normalizer; newly submitted contracts are
  // always validated and stored as normalized data above.
  const counterpart = validateNormalizedRevision(
    row.configJson && typeof row.configJson === "object" && (row.configJson as { rendererMode?: unknown }).rendererMode === "flexible"
      ? row.configJson
      : normalizedFromConfig("generic", row.configJson, other),
    "generic",
    other,
  );
  if (!compatibleLocales(current, counterpart)) throw new Error("BILINGUAL_INCOMPATIBLE");
}
async function createInitialDraft(tx: Tx, formId: bigint, locale: "ar" | "en", config: unknown) {
  const revisionId = await insertRevision(tx, formId, locale, config, "draft", 1);
  await tx.insert(formRevisionPointers).values({ formId, locale, draftRevisionId: revisionId, publishedRevisionId: null });
}
/** Create only a registry-owned generic form. No caller supplied renderer, component, or executable value is accepted. */
export async function createForm(input: unknown): Promise<CreateFormResult> {
  if (!mutationsAllowed()) return authRequired;
  const parsed = createFormInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT", message: "Invalid form request" };
  const config = bilingualGenericCreateConfigSchema.safeParse(parsed.data.config);
  if (!config.success) return { ok: false, code: "INVALID_CONFIG", message: "Arabic and English form configuration is required" };

  // Retrying the whole transaction makes unique-key allocation safe when two
  // creators choose the same generated key concurrently.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getDb().transaction(async (tx) => {
        const base = formKeyBase(parsed.data.formKey ?? parsed.data.name);
        const existing = await tx.select({ formKey: forms.formKey }).from(forms).where(eq(forms.formKey, base)).limit(1);
        if (existing.length) {
          let suffix = 2;
          let candidate = `${base}_${suffix}`;
          while ((await tx.select({ formKey: forms.formKey }).from(forms).where(eq(forms.formKey, candidate)).limit(1)).length) {
            suffix++;
            candidate = `${base}_${suffix}`;
          }
          await tx.insert(forms).values({ formKey: candidate, rendererKey: "generic", kind: "user", archived: false });
          const row = (await tx.select({ id: forms.id }).from(forms).where(eq(forms.formKey, candidate)).limit(1))[0];
          if (!row) throw new Error("Created form could not be read back");
          await createInitialDraft(tx, row.id, "ar", config.data.ar);
          await createInitialDraft(tx, row.id, "en", config.data.en);
          return { ok: true, formId: row.id.toString(), formKey: candidate, rendererKey: "generic" };
        }
        await tx.insert(forms).values({ formKey: base, rendererKey: "generic", kind: "user", archived: false });
        const row = (await tx.select({ id: forms.id }).from(forms).where(eq(forms.formKey, base)).limit(1))[0];
        if (!row) throw new Error("Created form could not be read back");
        await createInitialDraft(tx, row.id, "ar", config.data.ar);
        await createInitialDraft(tx, row.id, "en", config.data.en);
        return { ok: true, formId: row.id.toString(), formKey: base, rendererKey: "generic" };
      });
    } catch (error) {
      if (attempt < 2 && /duplicate|unique|constraint/i.test(String(error))) continue;
      console.error("[forms:create]", error);
      return { ok: false, code: "INTERNAL_ERROR", message: "Unable to create form" };
    }
  }
  return { ok: false, code: "FORM_KEY_CONFLICT", message: "Unable to allocate a unique form key" };
}

export async function saveFormDraft(input: unknown): Promise<Result> {
  if (!mutationsAllowed()) return authRequired;
  const value = parseInput(input); if (!value) return invalid;
  try { return await getDb().transaction(async (tx) => {
    const found = await target(tx, value); if (found === "stale") return stale; if (!found) return notFound;
    let submitted: ReturnType<typeof submittedConfig>; try { submitted = submittedConfig(found.form.rendererKey, value); } catch { return { ok: false, code: "INVALID_CONFIG", message: "Invalid form configuration" }; }
    const id = await insertRevision(tx, found.form.id, value.locale, submitted.config, "draft", await nextNumber(tx, found.form.id, value.locale), submitted.mode);
    // Revisions are immutable; retire the old pointer target before replacing it.
    await tx.update(formRevisions).set({ status: "archived" }).where(eq(formRevisions.id, found.draft.id));
    await tx.update(formRevisionPointers).set({ draftRevisionId: id }).where(and(eq(formRevisionPointers.formId, found.form.id), eq(formRevisionPointers.locale, value.locale)));
    return { ok: true, revisionToken: id.toString(), status: "draft" };
  }); } catch (error) { console.error("[forms:save-draft]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to save form" }; }
}
async function revalidateReferencingPages(formId: bigint) {
  const refs = await getDb().select({ locale: pages.locale, slug: pages.slug }).from(pageSections)
    .innerJoin(pageRevisions, eq(pageSections.revisionId, pageRevisions.id)).innerJoin(pages, eq(pageRevisions.pageId, pages.id))
    .where(eq(pageSections.formId, formId));
  for (const ref of refs) {
    try { revalidatePath(`/${ref.locale}${ref.slug ? `/${ref.slug}` : ""}`); }
    catch (error) { console.error("[forms:revalidate] failed", error); }
  }
}

export async function publishForm(input: unknown): Promise<Result> {
  if (!mutationsAllowed()) return authRequired;
  const value = parseInput(input); if (!value) return invalid;
  try {
    const result: Result = await getDb().transaction(async (tx) => {
    const found = await target(tx, value); if (found === "stale") return stale; if (!found) return notFound;
    let submitted: ReturnType<typeof submittedConfig>; try { submitted = submittedConfig(found.form.rendererKey, value); } catch { return { ok: false, code: "INVALID_CONFIG", message: "Invalid form configuration" }; }
    if (found.form.rendererKey === "generic") {
      try { await ensureBilingualPublish(tx, found.form.id, value.locale, submitted.config); }
      catch (error) { const code = String(error).includes("BILINGUAL_INCOMPATIBLE") ? "BILINGUAL_INCOMPATIBLE" : "BILINGUAL_REQUIRED"; return { ok: false, code, message: code === "BILINGUAL_INCOMPATIBLE" ? "Arabic and English fields/options must have the same structure before publishing." : "Both Arabic and English drafts are required before publishing." }; }
    }
    const published = await insertRevision(tx, found.form.id, value.locale, submitted.config, "published", await nextNumber(tx, found.form.id, value.locale), submitted.mode);
    const draft = await insertRevision(tx, found.form.id, value.locale, submitted.config, "draft", await nextNumber(tx, found.form.id, value.locale), submitted.mode);
    // Keep historical content untouched while retiring both superseded targets.
    await tx.update(formRevisions).set({ status: "archived" }).where(eq(formRevisions.id, found.draft.id));
    if (found.pointer.publishedRevisionId) {
      await tx.update(formRevisions).set({ status: "archived" }).where(eq(formRevisions.id, found.pointer.publishedRevisionId));
    }
    await tx.update(formRevisionPointers).set({ publishedRevisionId: published, draftRevisionId: draft }).where(and(eq(formRevisionPointers.formId, found.form.id), eq(formRevisionPointers.locale, value.locale)));
    return { ok: true, revisionToken: draft.toString(), status: "published" };
    });
    if (result.ok) await revalidateReferencingPages(BigInt(value.formId));
    return result;
  } catch (error) { console.error("[forms:publish]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to publish form" }; }
}
export async function discardFormDraft(formId: string, locale: string, revisionToken: string): Promise<Result> {
  if (!mutationsAllowed()) return authRequired;
  const value = parseInput({ formId, locale, revisionToken, config: {} }); if (!value) return invalid;
  try { return await getDb().transaction(async (tx) => {
    const found = await target(tx, value); if (found === "stale") return stale; if (!found || !found.pointer.publishedRevisionId) return notFound;
    const published = (await tx.select().from(formRevisions).where(and(eq(formRevisions.id, found.pointer.publishedRevisionId), eq(formRevisions.formId, found.form.id), eq(formRevisions.locale, value.locale), eq(formRevisions.status, "published"))).limit(1))[0];
    if (!published) return notFound;
    const draft = await insertRevision(tx, found.form.id, value.locale, published.configJson, "draft", await nextNumber(tx, found.form.id, value.locale), published.rendererMode === "flexible" ? "flexible" : "legacy");
    await tx.update(formRevisions).set({ status: "archived" }).where(eq(formRevisions.id, found.draft.id));
    await tx.update(formRevisionPointers).set({ draftRevisionId: draft }).where(and(eq(formRevisionPointers.formId, found.form.id), eq(formRevisionPointers.locale, value.locale)));
    return { ok: true, revisionToken: draft.toString(), status: "draft" };
  }); } catch (error) { console.error("[forms:discard]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to discard form" }; }
}
export const saveDraft = saveFormDraft;
export const publish = publishForm;
export const discardDraft = discardFormDraft;

export async function archiveForm(formId: string): Promise<{ ok: boolean; code?: string; message?: string }> { return changeArchive(formId, true); }
async function changeArchive(formId: string, archived: boolean): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (!mutationsAllowed()) return authRequired;
  if (!/^[1-9]\d*$/.test(formId)) return { ok: false, code: "INVALID_INPUT" };
  try {
    return await getDb().transaction(async (tx) => {
      const form = (await tx.select().from(forms).where(eq(forms.id, BigInt(formId))).limit(1))[0];
      if (!form) return { ok: false, code: "NOT_FOUND", message: "Form was not found" };
      if (form.kind === "system" || isBuiltInFormKey(form.formKey)) return { ok: false, code: "PROTECTED", message: "Built-in forms cannot be archived." };
      const references = await tx.select({ id: pageSections.id }).from(pageSections).where(eq(pageSections.formId, form.id)).limit(1);
      if (references.length) return { ok: false, code: "REFERENCED", message: "This form is referenced by a page section and cannot be archived." };
      await tx.update(forms).set({ archived }).where(eq(forms.id, form.id));
      return { ok: true };
    });
  } catch { return { ok: false, code: "INTERNAL_ERROR" }; }
}
export async function restoreForm(formId: string) { return changeArchive(formId, false); }
export async function deleteForm(formId: string): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (!mutationsAllowed()) return authRequired;
  if (!/^[1-9]\d*$/.test(formId)) return { ok: false, code: "INVALID_INPUT" };
  try { return await getDb().transaction(async (tx) => {
    const form = (await tx.select().from(forms).where(eq(forms.id, BigInt(formId))).limit(1))[0];
    if (!form) return { ok: false, code: "NOT_FOUND" }; if (form.kind === "system" || isBuiltInFormKey(form.formKey)) return { ok: false, code: "PROTECTED" };
    const refs = await tx.select({ id: pageSections.id }).from(pageSections).where(eq(pageSections.formId, form.id)).limit(1);
    const revisions = await tx.select({ id: formRevisions.id }).from(formRevisions).where(eq(formRevisions.formId, form.id)).limit(1);
    if (refs.length || revisions.length) return { ok: false, code: "REFERENCED_OR_HISTORICAL" };
    await tx.delete(forms).where(eq(forms.id, form.id)); return { ok: true };
  }); } catch { return { ok: false, code: "INTERNAL_ERROR" }; }
}
