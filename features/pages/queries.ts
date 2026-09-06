import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pageRevisionPointers, pageRevisions, pageSections, pages, settings } from "@/db/schema";
import type { Locale } from "@/lib/locales";
import { adaptPageContent, adaptEditorSections } from "./content-adapter";
import { getPublishedFormById } from "@/features/forms/queries";
import { pageDefinition } from "./page-map";
import type { EditorDocument } from "./types";

export async function getPage(locale: Locale, slug: string, revision: "published" | "draft" = "published") {
  const db = getDb();
  const page = await db.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, slug))).limit(1);
  if (!page[0]) {
    // Null is reserved for a genuinely unseeded database. A missing page in
    // an otherwise populated CMS is invalid content and must be visible.
    const existingPage = await db.select({ id: pages.id }).from(pages).limit(1);
    if (existingPage[0]) {
      throw new Error(`CMS page is missing: ${locale}:${slug || "home"}`);
    }
    return null;
  }
  const pointer = await db.select().from(pageRevisionPointers).where(eq(pageRevisionPointers.pageId, page[0].id)).limit(1);
  const revisionId = revision === "draft" ? pointer[0]?.draftRevisionId : pointer[0]?.publishedRevisionId;
  if (!revisionId) {
    throw new Error(`CMS page has no ${revision} revision pointer: ${locale}:${slug || "home"}`);
  }
  const revisionConditions = [
    eq(pageRevisions.id, revisionId),
    eq(pageRevisions.pageId, page[0].id),
    eq(pageRevisions.status, revision),
  ];
  const rows = await db.select().from(pageRevisions).where(and(...revisionConditions)).limit(1);
  if (!rows[0]) {
    throw new Error(`CMS ${revision} revision is missing or invalid: ${locale}:${slug || "home"}`);
  }
  const sections = await db.select().from(pageSections).where(eq(pageSections.revisionId, rows[0].id)).orderBy(asc(pageSections.sortOrder));
  const formSections = ["contact", "join_application", "partner_registration"] as const;

  // Built-in form sections are references, never content-bearing sections.
  // Validate their IDs before adapting contentJson so a broken reference can
  // never render a copied/stale form configuration.
  for (const section of sections) {
    const expected = formSections.includes(section.sectionKey as typeof formSections[number]) ? section.sectionKey : null;
    // Historical rows without formId use the isolated adapter fallback below.
    if (!expected && section.formId != null) {
      throw new Error(`Invalid form reference on ${locale}:${slug || "home"}`);
    }
  }

  const resolvedForms = new Map<string, { rendererKey: "contact" | "join_application" | "partner_registration" | "generic"; config: unknown }>();
  for (const section of sections) {
    const expected = formSections.includes(section.sectionKey as typeof formSections[number]) ? section.sectionKey : null;
    if (!expected) continue;
    // The validation above guarantees this is present; keep the guard local
    // so this remains safe if the database row type changes in the future.
    if (section.formId == null) continue;
    const resolved = await getPublishedFormById(section.formId.toString(), locale);
    const compatible = resolved && (resolved.form.rendererKey === "generic" || (resolved.form.rendererKey === expected && resolved.form.formKey === expected));
    if (!compatible) {
      throw new Error(`Published form reference is missing or incompatible on ${locale}:${slug || "home"}:${section.sectionKey}`);
    }
    resolvedForms.set(section.id.toString(), { rendererKey: resolved.form.rendererKey, config: resolved.config });
  }
  return adaptPageContent(rows[0], sections, slug, resolvedForms);
}

/**
 * Returns a client-safe editor document. Draft is preferred, with published as
 * a fallback when no draft pointer exists. BigInt IDs and Dates are strings.
 */
export async function getEditorDocument(pageId: string, locale: Locale, options?: { requireDraft?: boolean }): Promise<EditorDocument | null> {
  if (!/^[1-9]\d*$/.test(pageId)) return null;
  const numericId = BigInt(pageId);
  const db = getDb();
  const page = (await db.select().from(pages).where(and(eq(pages.id, numericId), eq(pages.locale, locale))).limit(1))[0];
  if (!page) return null;
  const pointer = (await db.select().from(pageRevisionPointers).where(eq(pageRevisionPointers.pageId, page.id)).limit(1))[0];
  const publishedRevision = pointer?.publishedRevisionId
    ? (await db.select({ id: pageRevisions.id })
      .from(pageRevisions)
      .where(and(
        eq(pageRevisions.id, pointer.publishedRevisionId),
        eq(pageRevisions.pageId, page.id),
        eq(pageRevisions.status, "published"),
      ))
      .limit(1))[0]
    : undefined;
  const hasPublishedRevision = Boolean(publishedRevision);
  const candidateIds = [pointer?.draftRevisionId, pointer?.publishedRevisionId].filter((id): id is bigint => id !== null && id !== undefined);
  if (candidateIds.length === 0) return null;
  // The editor must never receive an archived revision as a draft candidate.
  const candidates = await db.select().from(pageRevisions).where(and(
    eq(pageRevisions.pageId, page.id),
    eq(pageRevisions.id, candidateIds[0]),
    eq(pageRevisions.status, "draft"),
  )).limit(1);
  let revision = candidates[0];
  if (!revision && !options?.requireDraft) {
    const publishedId = pointer?.publishedRevisionId;
    if (!publishedId) return null;
    revision = (await db.select().from(pageRevisions).where(and(eq(pageRevisions.id, publishedId), eq(pageRevisions.pageId, page.id), eq(pageRevisions.status, "published"))).limit(1))[0];
  }
  if (!revision || (revision.status !== "draft" && revision.status !== "published")) return null;
  const rows = await db.select().from(pageSections).where(eq(pageSections.revisionId, revision.id)).orderBy(asc(pageSections.sortOrder));
  const definition = pageDefinition(page.slug);
  if (!definition) throw new Error(`Unknown CMS page slug: ${page.slug}`);
  const adaptedSections = adaptEditorSections(page.slug, rows);
  return {
    pageId: page.id.toString(), locale: page.locale, slug: page.slug as EditorDocument["slug"],
    revisionId: revision.id.toString(), revisionToken: revision.id.toString(), status: revision.status,
    hasPublishedRevision,
    title: revision.title, metaTitle: revision.metaTitle, metaDescription: revision.metaDescription,
    updatedAt: (revision.updatedAt ?? revision.createdAt).toISOString(),
    sections: rows.map((row, index) => ({
      key: row.sectionKey,
      type: row.sectionType,
      sortOrder: index,
      formId: row.formId === null ? null : row.formId.toString(),
      content: adaptedSections[row.sectionKey],
    })) as EditorDocument["sections"],
  };
}

export const getDraftOrPublishedEditorDocument = getEditorDocument;

export async function getSetting<T = unknown>(locale: Locale, key: string): Promise<T | null> {
  const row = await getDb().select({ value: settings.valueJson }).from(settings).where(eq(settings.key, `${locale}:${key}`)).limit(1);
  return (row[0]?.value ?? null) as T | null;
}

export async function listPages(locale?: Locale) {
  return getDb().select().from(pages).where(locale ? eq(pages.locale, locale) : undefined).orderBy(asc(pages.locale), asc(pages.slug));
}
