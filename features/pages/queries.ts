import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pageRevisionPointers, pageRevisions, pageSections, pages, settings } from "@/db/schema";
import type { Locale } from "@/lib/locales";
import { adaptPageContent } from "./content-adapter";

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
    ...(revision === "published" ? [eq(pageRevisions.status, "published")] : []),
  ];
  const rows = await db.select().from(pageRevisions).where(and(...revisionConditions)).limit(1);
  if (!rows[0]) {
    throw new Error(`CMS ${revision} revision is missing or invalid: ${locale}:${slug || "home"}`);
  }
  const sections = await db.select().from(pageSections).where(eq(pageSections.revisionId, rows[0].id)).orderBy(asc(pageSections.sortOrder));
  return adaptPageContent(rows[0], sections, slug);
}

export async function getSetting<T = unknown>(locale: Locale, key: string): Promise<T | null> {
  const row = await getDb().select({ value: settings.valueJson }).from(settings).where(eq(settings.key, `${locale}:${key}`)).limit(1);
  return (row[0]?.value ?? null) as T | null;
}

export async function listPages(locale?: Locale) {
  return getDb().select().from(pages).where(locale ? eq(pages.locale, locale) : undefined).orderBy(asc(pages.locale), asc(pages.slug));
}
