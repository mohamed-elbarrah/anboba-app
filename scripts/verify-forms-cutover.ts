import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { and, asc, eq } from "drizzle-orm";
import { closePool, getDb } from "../db/connection";
import { formRevisionPointers, formRevisions, forms, pageRevisionPointers, pageRevisions, pageSections, pages } from "../db/schema";
import { adaptSections } from "../features/pages/content-adapter";
import { runtimeConfigForRevision } from "../features/forms/repository";

const formKeys = new Set(["contact", "join_application", "partner_registration"]);
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  return value;
}
function same(a: unknown, b: unknown) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }

async function verify() {
  const db = getDb();
  const rows = await db.select({ page: pages, pointer: pageRevisionPointers }).from(pages).innerJoin(pageRevisionPointers, eq(pages.id, pageRevisionPointers.pageId));
  const failures: string[] = [];
  let checked = 0;
  for (const { page, pointer } of rows) {
    if (!pointer.publishedRevisionId) continue;
    const revision = (await db.select().from(pageRevisions).where(and(eq(pageRevisions.id, pointer.publishedRevisionId), eq(pageRevisions.pageId, page.id))).limit(1))[0];
    if (!revision) continue;
    const sections = await db.select().from(pageSections).where(eq(pageSections.revisionId, revision.id)).orderBy(asc(pageSections.sortOrder));
    const resolved = new Map<string, { rendererKey: typeof forms.$inferSelect.rendererKey; config: unknown }>();
    for (const section of sections) {
      if (!formKeys.has(section.sectionKey)) continue;
      checked++;
      if (section.formId === null) continue;
      const form = (await db.select().from(forms).where(and(eq(forms.id, section.formId), eq(forms.archived, false))).limit(1))[0];
      const formPointer = form ? (await db.select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, form.id), eq(formRevisionPointers.locale, page.locale))).limit(1))[0] : undefined;
      const formRevision = formPointer?.publishedRevisionId ? (await db.select().from(formRevisions).where(and(eq(formRevisions.id, formPointer.publishedRevisionId), eq(formRevisions.formId, section.formId), eq(formRevisions.locale, page.locale), eq(formRevisions.status, "published"))).limit(1))[0] : undefined;
      if (!form || !formRevision) { failures.push(`${page.locale}:${page.slug || "home"}:${section.sectionKey} unresolved form`); continue; }
      try { resolved.set(section.id.toString(), { rendererKey: form.rendererKey, config: await runtimeConfigForRevision(formRevision, form.rendererKey, db) }); }
      catch (error) { failures.push(`${page.locale}:${page.slug || "home"}:${section.sectionKey} invalid normalized contract: ${String(error)}`); }
    }
    let composed: Record<string, unknown>;
    try { composed = (adaptSections(page.slug, sections, resolved) as unknown) as Record<string, unknown>; }
    catch (error) { failures.push(`${page.locale}:${page.slug || "home"} composition failed: ${String(error)}`); continue; }
    for (const section of sections) {
      if (!formKeys.has(section.sectionKey)) continue;
      const output = composed[section.sectionKey] as Record<string, unknown>;
      const legacy = section.contentJson as Record<string, unknown>;
      // Legacy rows contained the full renderer config. Cutover rows contain
      // only section-owned keys; all keys retained in either form must agree.
      for (const [key, value] of Object.entries(legacy)) if (key in output && !same(output[key], value)) failures.push(`${page.locale}:${page.slug || "home"}:${section.sectionKey}.${key} differs`);
    }
  }
  if (failures.length) throw new Error(`Form cutover verification failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  console.log(`[forms-cutover-verify] checked=${checked} locales=ar,en forms=contact,join_application,partner_registration failures=0`);
}
verify().catch((error) => { console.error("[forms-cutover-verify] failed", error); process.exitCode = 1; }).finally(() => closePool());
