import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { formRevisionPointers, formRevisions, forms, pageRevisions, pageSections, pages } from "@/db/schema";
import type { Locale } from "@/lib/locales";
import { parseFormConfig, publicRendererKey } from "./registry";
import type { FormRevisionDTO } from "./schema";
import type { FormConfig } from "./registry-core";
import { readNormalizedRevision, runtimeConfigForRevision } from "./repository";

export type FormInventoryStatus = "published" | "draft" | "not-configured" | "invalid";
export type FormInventory = {
  id: string;
  formKey: string;
  rendererKey: "contact" | "join_application" | "partner_registration" | "generic";
  kind: "system" | "user";
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  locales: {
    ar: { draft: FormInventoryStatus; published: FormInventoryStatus };
    en: { draft: FormInventoryStatus; published: FormInventoryStatus };
  };
  references: Array<{ locale: Locale; slug: string; label: string; href: string }>;
};

const pageLabels: Record<string, string> = { "": "Home", about: "About", contact: "Contact", "join-us": "Join Us" };

function pointerStatus(pointerId: bigint | null, revisions: Map<string, typeof formRevisions.$inferSelect>, expected: "draft" | "published"): FormInventoryStatus {
  if (!pointerId) return "not-configured";
  const revision = revisions.get(pointerId.toString());
  if (!revision) return "invalid";
  return revision.status === expected ? expected : "invalid";
}

/** Dashboard-safe inventory DTO. It deliberately excludes form config and all database values. */
export async function getFormInventory(): Promise<FormInventory[]> {
  const db = getDb();
  const [formRows, pointerRows, revisionRows, referenceRows] = await Promise.all([
    db.select().from(forms).where(eq(forms.archived, false)).orderBy(asc(forms.formKey)),
    db.select().from(formRevisionPointers),
    db.select().from(formRevisions),
    db.select({ formId: pageSections.formId, locale: pages.locale, slug: pages.slug })
      .from(pageSections)
      .innerJoin(pageRevisions, eq(pageSections.revisionId, pageRevisions.id))
      .innerJoin(pages, eq(pageRevisions.pageId, pages.id)),
  ]);
  const revisions = new Map(revisionRows.map((revision) => [revision.id.toString(), revision]));
  const pointers = new Map(pointerRows.map((pointer) => [`${pointer.formId}:${pointer.locale}`, pointer]));
  const seenReferences = new Set<string>();
  const referencesByForm = new Map<string, FormInventory["references"]>();
  for (const reference of referenceRows) {
    if (reference.formId === null) continue;
    const key = `${reference.formId}:${reference.locale}:${reference.slug}`;
    if (seenReferences.has(key)) continue;
    seenReferences.add(key);
    const list = referencesByForm.get(reference.formId.toString()) ?? [];
    list.push({ locale: reference.locale, slug: reference.slug, label: pageLabels[reference.slug] ?? reference.slug, href: `/${reference.locale}${reference.slug ? `/${reference.slug}` : ""}` });
    referencesByForm.set(reference.formId.toString(), list);
  }
  return formRows.map((form) => {
    const locales = (locale: Locale) => {
      const pointer = pointers.get(`${form.id}:${locale}`);
      return { draft: pointerStatus(pointer?.draftRevisionId ?? null, revisions, "draft"), published: pointerStatus(pointer?.publishedRevisionId ?? null, revisions, "published") };
    };
    const formRevisionsForPointers = ["ar", "en"].flatMap((locale) => {
      const pointer = pointers.get(`${form.id}:${locale}`);
      return [pointer?.draftRevisionId, pointer?.publishedRevisionId].filter((id): id is bigint => id !== null && id !== undefined).map((id) => revisions.get(id.toString())?.updatedAt ?? null);
    }).filter((date): date is Date => date !== null);
    const latestRevisionUpdate = formRevisionsForPointers.sort((left, right) => right.getTime() - left.getTime())[0];
    return {
      id: form.id.toString(), formKey: form.formKey, rendererKey: form.rendererKey as FormInventory["rendererKey"], kind: form.kind, archived: form.archived,
      createdAt: form.createdAt.toISOString(), updatedAt: (latestRevisionUpdate ?? form.updatedAt).toISOString(), locales: { ar: locales("ar"), en: locales("en") }, references: referencesByForm.get(form.id.toString()) ?? [],
    };
  });
}


export type DashboardFormOption = {
  id: string;
  formKey: string;
  rendererKey: string;
  kind: "system" | "user";
  archived: boolean;
  publicPreviewUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listForms(options?: { includeArchived?: boolean }): Promise<DashboardFormOption[]> {
  const rows = await getDb().select().from(forms).where(options?.includeArchived ? undefined : eq(forms.archived, false)).orderBy(asc(forms.formKey));
  return rows.map((row) => ({ id: row.id.toString(), formKey: row.formKey, rendererKey: row.rendererKey, kind: row.kind, archived: row.archived, publicPreviewUrl: row.rendererKey === "contact" ? "/ar/contact" : row.rendererKey === "join_application" ? "/ar" : row.rendererKey === "partner_registration" ? "/ar/join-us" : null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}

export async function getForm(formId: string, locale: Locale, revision: "draft" | "published" = "draft") {
  if (!/^[1-9]\d*$/.test(formId)) return null;
  const id = BigInt(formId);
  const form = (await getDb().select().from(forms).where(eq(forms.id, id)).limit(1))[0];
  if (!form || form.archived) return null;
  const pointer = (await getDb().select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, id), eq(formRevisionPointers.locale, locale))).limit(1))[0];
  const revisionId = revision === "published" ? pointer?.publishedRevisionId : pointer?.draftRevisionId;
  if (!revisionId) return null;
  const revisionRow = (await getDb().select().from(formRevisions).where(and(eq(formRevisions.id, revisionId), eq(formRevisions.formId, id), eq(formRevisions.locale, locale), eq(formRevisions.status, revision))).limit(1))[0];
  if (!revisionRow) return null;
  const normalized = await readNormalizedRevision(revisionRow, form.rendererKey);
  const refs = await getDb().select({ locale: pages.locale, slug: pages.slug }).from(pageSections).innerJoin(pageRevisions, eq(pageSections.revisionId, pageRevisions.id)).innerJoin(pages, eq(pageRevisions.pageId, pages.id)).where(eq(pageSections.formId, id));
  const references = refs.map(reference => ({ locale: reference.locale as Locale, label: pageLabels[reference.slug] ?? reference.slug, href: `/${reference.locale}${reference.slug ? `/${reference.slug}` : ""}` }));
  return { form: { id: form.id.toString(), formKey: form.formKey, rendererKey: form.rendererKey, kind: form.kind, archived: form.archived }, references, revision: { ...dtoFor(revisionRow, form.rendererKey), config: (await runtimeConfigForRevision(revisionRow, form.rendererKey)) as FormConfig, normalized } };
}
function dtoFor(row: typeof formRevisions.$inferSelect, rendererKey: typeof forms.$inferSelect.rendererKey): FormRevisionDTO {
  // Flexible revisions are stored as the normalized contract, not as the
  // built-in renderer's legacy config. Keep the dashboard DTO aligned with
  // that persisted boundary instead of parsing it as a legacy schema.
  const config = row.rendererMode === "flexible"
    ? row.configJson
    : parseFormConfig(rendererKey, row.configJson);
  return { id: row.id.toString(), formId: row.formId.toString(), locale: row.locale, revisionNumber: row.revisionNumber, status: row.status === "published" ? "published" : "draft", config, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
export async function getPublishedFormById(formId: string, locale: Locale) {
  if (!/^[1-9]\d*$/.test(formId)) return null;
  const id = BigInt(formId);
  const db = getDb();
  const form = (await db.select().from(forms).where(and(eq(forms.id, id), eq(forms.archived, false))).limit(1))[0];
  if (!form || (form.rendererKey !== "generic" && publicRendererKey(form.rendererKey) !== form.formKey)) return null;
  const pointer = (await db.select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, id), eq(formRevisionPointers.locale, locale))).limit(1))[0];
  if (!pointer?.publishedRevisionId) return null;
  const row = (await db.select().from(formRevisions).where(and(eq(formRevisions.id, pointer.publishedRevisionId), eq(formRevisions.formId, id), eq(formRevisions.locale, locale), eq(formRevisions.status, "published"))).limit(1))[0];
  if (!row) return null;
  try { return { form, config: await runtimeConfigForRevision(row, form.rendererKey) }; } catch { return null; }
}

export async function getPublicForm(formKey: string, locale: Locale) {
  const form = (await getDb().select().from(forms).where(and(eq(forms.formKey, formKey), eq(forms.archived, false))).limit(1))[0];
  // Public references may use a user-created generic form, but only through
  // a published normalized revision; built-ins still require key agreement.
  if (!form || (form.rendererKey !== "generic" && publicRendererKey(form.rendererKey) !== form.formKey)) return null;
  const pointer = (await getDb().select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, form.id), eq(formRevisionPointers.locale, locale))).limit(1))[0];
  if (!pointer?.publishedRevisionId) return null;
  const row = (await getDb().select().from(formRevisions).where(and(eq(formRevisions.id, pointer.publishedRevisionId), eq(formRevisions.formId, form.id), eq(formRevisions.locale, locale), eq(formRevisions.status, "published"))).limit(1))[0];
  if (!row) return null;
  try { return { rendererKey: form.rendererKey, config: await runtimeConfigForRevision(row, form.rendererKey) }; } catch { return null; }
}
