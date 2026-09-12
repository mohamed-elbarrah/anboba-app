import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import ar from "../dictionaries/ar.json" with { type: "json" };
import en from "../dictionaries/en.json" with { type: "json" };
import { arabicLegalDocuments, englishLegalDocuments } from "../content/legal/policies";
import { closePool, getDb, getPool } from "../db/connection";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../db/schema";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";
import { pageRevisionPointers, pageRevisions, pageSections, pages, settings } from "../db/schema";
import { pageDefinitions } from "../features/pages/page-map";
import { parseSectionContent } from "../features/pages/content-schemas";
import { and, eq } from "drizzle-orm";

const dictionaries = { ar, en } as const;
const legal = { ar: arabicLegalDocuments, en: englishLegalDocuments } as const;
const pageTitles = { home: "home", about: "about", contact: "contact", "join-us": "joinUs", faq: "faq", policies: "policies" } as const;

type Locale = keyof typeof dictionaries;
type RevisionStatus = "published" | "draft";
type SeedPage = (typeof pageDefinitions)[number];

function contentFor(locale: Locale, slug: string, key: string) {
  const dictionary = dictionaries[locale] as Record<string, unknown>;
  if (key === "policies") return { hero: dictionary.pageTitle, documents: legal[locale] };
  const source = key === "why_choose_us" ? "whyChooseUs" :
    key === "service_overview" ? "serviceOverview" : key === "service_benefits" ? "serviceBenefits" :
    key === "join_application" ? "joinApplication" : key === "faq_support" ? "faqSupport" : key === "faq" ? "faqPage" :
    key === "vision_mission" ? "aboutVisionMission" : key === "partner_registration" ? "partnerRegistration" : key;
  return dictionary[source];
}

function seedRef(locale: Locale, slug: string) {
  return `${locale}:${slug || "home"}`;
}

function refuse(message: string): never {
  throw new Error(`Seed safety check failed: ${message}. Published data and pointers were not repaired or repointed.`);
}

/** Compare JSON as data, not as object-key insertion order. */
function canonical(value: unknown): unknown {
  if (typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

async function insertRevision(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], pageId: bigint, status: RevisionStatus, revisionNumber: number, title: string, metaDescription: string | undefined) {
  const result = await tx.insert(pageRevisions).values({ pageId, revisionNumber, status, title, metaTitle: title, metaDescription });
  const revision = (await tx.select().from(pageRevisions).where(eq(pageRevisions.id, BigInt(result[0].insertId))).limit(1))[0];
  if (!revision) throw new Error(`Could not read back ${status} revision`);
  return revision;
}

async function insertSections(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], revisionId: bigint, locale: Locale, definition: SeedPage, titleSlug: string) {
  for (const [sortOrder, sectionKey] of definition.sections.entries()) {
    await tx.insert(pageSections).values({
      revisionId,
      sectionKey,
      sectionType: sectionKey,
      sortOrder,
      contentJson: parseSectionContent(sectionKey, contentFor(locale, titleSlug, sectionKey)),
    });
  }
}

async function seed() {
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  await acquireDataLock(connection);
  try { await db.transaction(async (tx) => {
    // Settings are part of the initial seed only. Once any page or setting
    // exists, reruns must leave CMS-managed settings exactly as found.
    const hasExistingPages = (await tx.select({ id: pages.id }).from(pages).limit(1)).length > 0;
    const hasExistingSettings = (await tx.select({ id: settings.id }).from(settings).limit(1)).length > 0;
    const pristine = !hasExistingPages && !hasExistingSettings;

    for (const locale of ["ar", "en"] as const) {
      const dictionary = dictionaries[locale];
      for (const definition of pageDefinitions) {
        const ref = seedRef(locale, definition.slug);
        const titleKey = pageTitles[(definition.slug || "home") as keyof typeof pageTitles];
        const title = definition.slug === "policies" ? dictionary.pageTitle.heading : dictionary.pages[titleKey];
        const metaDescription = definition.slug === "policies" ? dictionary.pageTitle.description : definition.slug === "faq" ? dictionary.faqPage.description : undefined;
        let page = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, definition.slug))).limit(1))[0];

        // A page with no identity is the only case where the complete initial seed is created.
        if (!page) {
          await tx.insert(pages).values({ locale, slug: definition.slug });
          page = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, definition.slug))).limit(1))[0];
          if (!page) refuse(`could not create page ${ref}`);
          const published = await insertRevision(tx, page.id, "published", 1, title, metaDescription);
          const draft = await insertRevision(tx, page.id, "draft", 2, title, metaDescription);
          await insertSections(tx, published.id, locale, definition, definition.slug);
          await insertSections(tx, draft.id, locale, definition, definition.slug);
          await tx.insert(pageRevisionPointers).values({ pageId: page.id, draftRevisionId: draft.id, publishedRevisionId: published.id });
          continue;
        }

        const revisions = await tx.select().from(pageRevisions).where(eq(pageRevisions.pageId, page.id));
        const publishedRows = revisions.filter((revision) => revision.status === "published");
        const draftRows = revisions.filter((revision) => revision.status === "draft");
        if (publishedRows.length !== 1) refuse(`${ref} must have exactly one published revision; refusing to choose or create one`);
        if (draftRows.length > 1) refuse(`${ref} has multiple draft revisions; refusing to choose one`);
        const published = publishedRows[0];

        // Existing published revisions are a gate: every field and section must match,
        // and none of them are ever updated, even when malformed.
        if (published.title !== title || published.metaTitle !== title || published.metaDescription !== (metaDescription ?? null)) {
          refuse(`${ref} published revision metadata does not match the expected seed`);
        }
        const publishedSections = await tx.select().from(pageSections).where(eq(pageSections.revisionId, published.id));
        if (publishedSections.length !== definition.sections.length) refuse(`${ref} published revision has missing or extra sections`);
        for (const [sortOrder, sectionKey] of definition.sections.entries()) {
          const matches = publishedSections.filter((section) => section.sectionKey === sectionKey);
          if (matches.length !== 1) refuse(`${ref} published revision section ${sectionKey} is missing or duplicated`);
          const section = matches[0];
          const expected = parseSectionContent(sectionKey, contentFor(locale, definition.slug, sectionKey));
          let actual: unknown;
          try {
            actual = parseSectionContent(sectionKey, section.contentJson);
          } catch {
            refuse(`${ref} published section ${sectionKey} is invalid`);
          }
          if (section.sectionType !== sectionKey || section.sortOrder !== sortOrder || !sameJson(actual, expected)) {
            refuse(`${ref} published section ${sectionKey} does not exactly match the expected seed`);
          }
        }

        const pointer = (await tx.select().from(pageRevisionPointers).where(eq(pageRevisionPointers.pageId, page.id)).limit(1))[0];
        if (!pointer || pointer.publishedRevisionId !== published.id) {
          refuse(`${ref} published revision pointer is missing or invalid; refusing to repoint it`);
        }

        const draft = draftRows[0];
        if (draft) {
          if (pointer.draftRevisionId !== draft.id) refuse(`${ref} draft pointer is missing or invalid; refusing to repoint existing content`);
          continue;
        }

        // The only repair allowed for an existing page is adding its absent draft.
        // The published revision and its pointer column are left untouched.
        if (pointer.draftRevisionId !== null) refuse(`${ref} points to a missing draft revision; refusing to repoint it`);
        const nextRevisionNumber = Math.max(0, ...revisions.map((item) => item.revisionNumber)) + 1;
        const newDraft = await insertRevision(tx, page.id, "draft", nextRevisionNumber, title, metaDescription);
        await insertSections(tx, newDraft.id, locale, definition, definition.slug);
        await tx.update(pageRevisionPointers).set({ draftRevisionId: newDraft.id }).where(eq(pageRevisionPointers.pageId, page.id));
      }

      if (pristine) {
        for (const [key, value] of [["pages", dictionary.pages], ["footer", dictionary.footer]] as const) {
          await tx.insert(settings).values({ key: `${locale}:${key}`, valueJson: value });
        }
      }
    }
  }); } finally { await releaseDataLock(connection); connection.release(); }
  console.log("Content seed complete.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
