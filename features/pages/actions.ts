'use server';

import { revalidatePath } from "next/cache";
import { and, asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { forms, pageRevisionPointers, pageRevisions, pageSections, pages } from "@/db/schema";
import { isLocale } from "@/lib/locales";
import { pageDefinition } from "./page-map";
import { parseSectionContent, parseSectionOwnedFormContent, parseStrictSectionOwnedFormContent } from "./content-schemas";
import { sectionKeys } from "@/db/schema";

/** Authentication is deferred; production CMS mutations fail closed. */
const authRequired = { ok: false, code: "AUTH_REQUIRED", message: "Authentication is required for page mutations" } as const;
function mutationsAllowed() { return process.env.NODE_ENV !== "production"; }
const idSchema = z.string().regex(/^[1-9]\d*$/, "Invalid numeric id");
const documentSchema = z.object({
  pageId: idSchema,
  locale: z.string(),
  revisionToken: idSchema,
  title: z.string().trim().min(1).max(255),
  metaTitle: z.string().max(255).nullable(),
  metaDescription: z.string().max(65535).nullable(),
  sections: z.array(z.object({
    key: z.enum(sectionKeys),
    type: z.enum(sectionKeys),
    sortOrder: z.number().int().nonnegative(),
    formId: z.string().regex(/^[1-9]\d*$/).nullable().default(null),
    content: z.unknown(),
  })),
});

export type EditorDocumentInput = z.input<typeof documentSchema>;
export type PageActionResult =
  | { ok: true; revisionToken: string; status: "draft" | "published" }
  | { ok: false; code: "AUTH_REQUIRED" | "INVALID_INPUT" | "NOT_FOUND" | "STALE_REVISION" | "INVALID_DOCUMENT" | "INTERNAL_ERROR"; message: string };

type MutationResult = PageActionResult & { revalidationSlug?: string };

const failures = {
  invalidInput: { ok: false, code: "INVALID_INPUT", message: "Invalid request" } as const,
  notFound: { ok: false, code: "NOT_FOUND", message: "Page or draft was not found" } as const,
  stale: { ok: false, code: "STALE_REVISION", message: "The draft is out of date" } as const,
  invalidDocument: { ok: false, code: "INVALID_DOCUMENT", message: "Invalid page content" } as const,
  internal: { ok: false, code: "INTERNAL_ERROR", message: "Unable to complete the request" } as const,
};

function logActionFailure(action: string, error: unknown) {
  console.error(`[cms:${action}] failed`, error);
}

function safeRevalidate(locale: "ar" | "en", slug: string) {
  try {
    const path = `/${locale}${slug ? `/${slug}` : ""}`;
    revalidatePath(path);
    if (slug === "policies") revalidatePath(path, "layout");
  } catch (error) {
    // The database mutation has already committed; invalidation must not make it look failed.
    logActionFailure("revalidate", error);
  }
}

function publicResult(result: MutationResult): PageActionResult {
  if (result.ok) return { ok: true, revisionToken: result.revisionToken, status: result.status };
  return result;
}

type ValidDocument = z.infer<typeof documentSchema> & { locale: "ar" | "en"; pageId: string; revisionToken: string };

function parseDocument(input: unknown): { document?: ValidDocument; error?: PageActionResult } {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success || !isLocale(parsed.data?.locale ?? "")) {
    return { error: failures.invalidInput };
  }
  const document = parsed.data as ValidDocument;
  return { document };
}

const builtInFormForSection = { contact: "contact", join_application: "join_application", partner_registration: "partner_registration" } as const;

async function validateSections(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], document: ValidDocument, slug: string) {
  const expected = pageDefinition(slug)?.sections;
  if (!expected || document.sections.length !== expected.length) return false;
  for (const [index, section] of document.sections.entries()) {
    const key = expected[index];
    if (section.key !== key || section.type !== key || section.sortOrder !== index) return false;
    try {
      if (key === "contact" || key === "join_application" || key === "partner_registration") parseStrictSectionOwnedFormContent(key, section.content);
      else parseSectionContent(key, section.content);
    } catch { return false; }
    const expectedForm = builtInFormForSection[key as keyof typeof builtInFormForSection];
    // The three executable built-in sections must always point at their stable
    // seeded form identity. Never fall back to copied section content.
    if (expectedForm) {
      if (section.formId === null) return false;
      const form = (await tx.select().from(forms).where(eq(forms.id, BigInt(section.formId))).limit(1))[0];
      if (!form || form.archived || form.kind !== "system" || form.formKey !== expectedForm || form.rendererKey !== expectedForm) return false;
    } else if (section.formId !== null) return false;
  }
  return true;
}

function invalidDocument(): PageActionResult {
  return failures.invalidDocument;
}

async function nextRevisionNumber(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], pageId: bigint) {
  const row = await tx.select({ value: max(pageRevisions.revisionNumber) }).from(pageRevisions).where(eq(pageRevisions.pageId, pageId));
  return Number(row[0]?.value ?? 0) + 1;
}

async function insertRevision(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  document: ValidDocument,
  pageId: bigint,
  status: "draft" | "published",
  revisionNumber: number,
) {
  const result = await tx.insert(pageRevisions).values({
    pageId,
    revisionNumber,
    status,
    title: document.title,
    metaTitle: document.metaTitle,
    metaDescription: document.metaDescription,
  });
  const revisionId = BigInt(result[0].insertId);
  await tx.insert(pageSections).values(document.sections.map((section) => ({
    revisionId,
    sectionKey: section.key,
    sectionType: section.type,
    sortOrder: section.sortOrder,
    formId: section.formId === null ? null : BigInt(section.formId),
    contentJson: section.content,
  })));
  return revisionId;
}

async function loadTarget(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], document: ValidDocument) {
  const pageId = BigInt(document.pageId);
  const page = (await tx.select().from(pages).where(and(eq(pages.id, pageId), eq(pages.locale, document.locale))).limit(1))[0];
  if (!page) return null;
  // MySQL's row lock makes pointer validation and the following revision-number
  // allocation one atomic operation for concurrent writers.
  const pointer = (await tx.select().from(pageRevisionPointers)
    .where(eq(pageRevisionPointers.pageId, pageId))
    .limit(1)
    .for("update"))[0];
  if (!pointer?.draftRevisionId) return null;
  if (pointer.draftRevisionId.toString() !== document.revisionToken) return "stale" as const;
  const draft = (await tx.select().from(pageRevisions).where(and(eq(pageRevisions.id, pointer.draftRevisionId), eq(pageRevisions.pageId, pageId), eq(pageRevisions.status, "draft"))).limit(1))[0];
  if (!draft) return null;
  return { page, pointer, draft };
}

async function runMutation(action: string, locale: "ar" | "en", work: () => Promise<MutationResult>): Promise<PageActionResult> {
  try {
    const result = await work();
    if (result.ok && result.revalidationSlug !== undefined) safeRevalidate(locale, result.revalidationSlug);
    return publicResult(result);
  } catch (error) {
    logActionFailure(action, error);
    return failures.internal;
  }
}

export async function saveDraft(input: EditorDocumentInput): Promise<PageActionResult> {
  if (!mutationsAllowed()) return authRequired;
  const parsed = parseDocument(input);
  if (parsed.error) return parsed.error;
  const document = parsed.document;
  if (!document) return failures.invalidInput;
  return runMutation("save-draft", document.locale, async () => {
    const result = await getDb().transaction(async (tx) => {
      const target = await loadTarget(tx, document);
      if (target === "stale") return failures.stale;
      if (!target) return failures.notFound;
      if (!(await validateSections(tx, document, target.page.slug))) return invalidDocument();
      await tx.update(pageRevisions).set({ status: "archived" }).where(eq(pageRevisions.id, target.draft.id));
      const revisionId = await insertRevision(tx, document, target.page.id, "draft", await nextRevisionNumber(tx, target.page.id));
      await tx.update(pageRevisionPointers).set({ draftRevisionId: revisionId }).where(eq(pageRevisionPointers.pageId, target.page.id));
      return { ok: true, revisionToken: revisionId.toString(), status: "draft", revalidationSlug: target.page.slug } as const;
    });
    return result;
  });
}

export async function publishPage(input: EditorDocumentInput): Promise<PageActionResult> {
  if (!mutationsAllowed()) return authRequired;
  const parsed = parseDocument(input);
  if (parsed.error) return parsed.error;
  const document = parsed.document;
  if (!document) return failures.invalidInput;
  return runMutation("publish-page", document.locale, async () => {
    return getDb().transaction(async (tx) => {
      const target = await loadTarget(tx, document);
      if (target === "stale") return failures.stale;
      if (!target) return failures.notFound;
      if (!(await validateSections(tx, document, target.page.slug))) return invalidDocument();
      if (target.pointer.publishedRevisionId) await tx.update(pageRevisions).set({ status: "archived" }).where(eq(pageRevisions.id, target.pointer.publishedRevisionId));
      await tx.update(pageRevisions).set({ status: "archived" }).where(eq(pageRevisions.id, target.draft.id));
      const publishedId = await insertRevision(tx, document, target.page.id, "published", await nextRevisionNumber(tx, target.page.id));
      const draftId = await insertRevision(tx, document, target.page.id, "draft", await nextRevisionNumber(tx, target.page.id));
      await tx.update(pageRevisionPointers).set({ publishedRevisionId: publishedId, draftRevisionId: draftId }).where(eq(pageRevisionPointers.pageId, target.page.id));
      return { ok: true, revisionToken: draftId.toString(), status: "published", revalidationSlug: target.page.slug } as const;
    });
  });
}

export async function discardDraft(pageId: string, locale: string, revisionToken: string): Promise<PageActionResult> {
  if (!mutationsAllowed()) return authRequired;
  const parsed = z.object({ pageId: idSchema, locale: z.string(), revisionToken: idSchema }).safeParse({ pageId, locale, revisionToken });
  if (!parsed.success || !isLocale(locale)) return failures.invalidInput;
  return runMutation("discard-draft", locale, async () => {
    return getDb().transaction(async (tx) => {
      const target = await loadTarget(tx, { ...parsed.data, locale, title: "", metaTitle: null, metaDescription: null, sections: [] });
      if (target === "stale") return failures.stale;
      if (!target || !target.pointer.publishedRevisionId) return failures.notFound;
      const published = (await tx.select().from(pageRevisions).where(and(eq(pageRevisions.id, target.pointer.publishedRevisionId), eq(pageRevisions.pageId, target.page.id), eq(pageRevisions.status, "published"))).limit(1))[0];
      if (!published) return failures.notFound;
      const sections = await tx.select().from(pageSections).where(eq(pageSections.revisionId, published.id)).orderBy(asc(pageSections.sortOrder));
      const document: ValidDocument = { pageId, locale, revisionToken, title: published.title, metaTitle: published.metaTitle, metaDescription: published.metaDescription, sections: sections.map((section) => ({ key: section.sectionKey, type: section.sectionType, sortOrder: section.sortOrder, formId: section.formId === null ? null : section.formId.toString(), content: section.formId !== null && (section.sectionKey === "contact" || section.sectionKey === "join_application" || section.sectionKey === "partner_registration") ? parseSectionOwnedFormContent(section.sectionKey, section.contentJson) : section.contentJson })) };
      if (!(await validateSections(tx, document, target.page.slug))) return invalidDocument();
      await tx.update(pageRevisions).set({ status: "archived" }).where(eq(pageRevisions.id, target.draft.id));
      const draftId = await insertRevision(tx, document, target.page.id, "draft", await nextRevisionNumber(tx, target.page.id));
      await tx.update(pageRevisionPointers).set({ draftRevisionId: draftId }).where(eq(pageRevisionPointers.pageId, target.page.id));
      return { ok: true, revisionToken: draftId.toString(), status: "draft", revalidationSlug: target.page.slug } as const;
    });
  });
}
