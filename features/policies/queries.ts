import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/connection";
import { policyDocuments, policyRevisionPointers, policyRevisions } from "@/db/schema";
import type { Locale } from "@/lib/locales";
import { richTextSchema } from "./content-schema";
import type { PolicyDocument, PolicyListItem } from "./types";

function toDocument(row: typeof policyDocuments.$inferSelect, revision: typeof policyRevisions.$inferSelect): PolicyDocument {
  const content = richTextSchema.parse(revision.contentJson);
  return { id: row.id.toString(), locale: row.locale, slug: row.slug, title: revision.title, summary: revision.summary, content, revisionId: revision.id.toString(), revisionToken: revision.id.toString(), status: revision.status === "published" ? "published" : "draft", updatedAt: revision.updatedAt.toISOString() };
}

export async function listPolicies(locale?: Locale): Promise<PolicyListItem[]> {
  const rows = await getDb().select({ document: policyDocuments, pointer: policyRevisionPointers, draft: policyRevisions }).from(policyDocuments).leftJoin(policyRevisionPointers, eq(policyRevisionPointers.policyDocumentId, policyDocuments.id)).leftJoin(policyRevisions, and(eq(policyRevisions.id, policyRevisionPointers.draftRevisionId), eq(policyRevisions.status, "draft"))).where(locale ? and(eq(policyDocuments.locale, locale), isNull(policyDocuments.archivedAt)) : isNull(policyDocuments.archivedAt)).orderBy(asc(policyDocuments.locale), asc(policyDocuments.slug));
  return rows.filter((row) => row.draft).map(({ document, pointer, draft }) => ({ id: document.id.toString(), locale: document.locale, slug: document.slug, title: draft!.title, status: draft!.status === "published" ? "published" : "draft", published: pointer?.publishedRevisionId != null, updatedAt: draft!.updatedAt.toISOString() }));
}

export async function getPolicyEditor(id: string) {
  const document = (await getDb().select().from(policyDocuments).where(eq(policyDocuments.id, BigInt(id))).limit(1))[0];
  if (!document) return null;
  const pointer = (await getDb().select().from(policyRevisionPointers).where(eq(policyRevisionPointers.policyDocumentId, document.id)).limit(1))[0];
  if (!pointer?.draftRevisionId) return null;
  const revision = (await getDb().select().from(policyRevisions).where(and(eq(policyRevisions.id, pointer.draftRevisionId), eq(policyRevisions.policyDocumentId, document.id))).limit(1))[0];
  return revision ? toDocument(document, revision) : null;
}

export async function getPublishedPolicies(locale: Locale) {
  const rows = await getDb().select({ document: policyDocuments, revision: policyRevisions }).from(policyDocuments).innerJoin(policyRevisionPointers, eq(policyRevisionPointers.policyDocumentId, policyDocuments.id)).innerJoin(policyRevisions, and(eq(policyRevisions.id, policyRevisionPointers.publishedRevisionId), eq(policyRevisions.policyDocumentId, policyDocuments.id), eq(policyRevisions.status, "published"))).where(eq(policyDocuments.locale, locale)).orderBy(asc(policyDocuments.slug));
  return rows.map(({ document, revision }) => toDocument(document, revision));
}

export async function getPublishedPolicy(locale: Locale, slug: string) {
  const policies = await getPublishedPolicies(locale);
  return policies.find((policy) => policy.slug === slug) ?? null;
}
