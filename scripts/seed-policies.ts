import { loadEnvConfig } from "@next/env";
import { and, eq } from "drizzle-orm";
import { getDb, closePool } from "../db/connection";
import { admins, policyDocuments, policyRevisionPointers, policyRevisions } from "../db/schema";
import { arabicLegalDocuments, englishLegalDocuments, type LegalDocument } from "../content/legal/policies";

loadEnvConfig(process.cwd());

function toRichText(document: LegalDocument) {
  return {
    type: "doc",
    content: document.sections.flatMap((section) => [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: section.heading }] },
      ...(section.paragraphs ?? []).map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
      ...(section.items ? [{ type: "bulletList", content: section.items.map((text) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text }] }] })) }] : []),
    ]),
  };
}

async function main() {
  const admin = (await getDb().select({ id: admins.id }).from(admins).where(eq(admins.isActive, true)).limit(1))[0];
  if (!admin) throw new Error("An active admin is required before seeding policies");
  await getDb().transaction(async (tx) => {
    for (const [locale, documents] of [["ar", arabicLegalDocuments], ["en", englishLegalDocuments]] as const) {
      for (const document of documents) {
        const existing = (await tx.select().from(policyDocuments).where(and(eq(policyDocuments.locale, locale), eq(policyDocuments.slug, document.slug))).limit(1))[0];
        if (existing) continue;
        const inserted = await tx.insert(policyDocuments).values({ locale, slug: document.slug });
        const documentId = BigInt(inserted[0].insertId);
        const content = toRichText(document);
        const published = await tx.insert(policyRevisions).values({ policyDocumentId: documentId, revisionNumber: 1, status: "published", title: document.title, summary: document.summary, contentJson: content, createdBy: admin.id });
        const publishedId = BigInt(published[0].insertId);
        const draft = await tx.insert(policyRevisions).values({ policyDocumentId: documentId, revisionNumber: 2, status: "draft", title: document.title, summary: document.summary, contentJson: content, createdBy: admin.id });
        await tx.insert(policyRevisionPointers).values({ policyDocumentId: documentId, draftRevisionId: BigInt(draft[0].insertId), publishedRevisionId: publishedId });
      }
    }
  });
  console.log("Policies seeded successfully");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => closePool());
