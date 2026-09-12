import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import ar from "../dictionaries/ar.json" with { type: "json" };
import en from "../dictionaries/en.json" with { type: "json" };
import { closePool, getPool } from "../db/connection";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq } from "drizzle-orm";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";
import * as schema from "../db/schema";
import { pageRevisionPointers, pageRevisions, pageSections, pages } from "../db/schema";
import { parseSectionContent } from "../features/pages/content-schemas";

const dictionaries = { ar, en } as const;

async function seedFaq() {
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  await acquireDataLock(connection);
  try {
    await db.transaction(async (tx) => {
      for (const locale of ["ar", "en"] as const) {
        const dictionary = dictionaries[locale];
        const existing = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, "faq"))).limit(1))[0];
        if (existing) continue;

        await tx.insert(pages).values({ locale, slug: "faq" });
        const page = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, "faq"))).limit(1))[0];
        if (!page) throw new Error(`Could not create ${locale}:faq`);

        const content = parseSectionContent("faq", dictionary.faqPage);
        const publishedResult = await tx.insert(pageRevisions).values({
          pageId: page.id,
          revisionNumber: 1,
          status: "published",
          title: dictionary.pages.faq,
          metaTitle: dictionary.pages.faq,
          metaDescription: dictionary.faqPage.description,
        });
        const publishedId = BigInt(publishedResult[0].insertId);
        await tx.insert(pageSections).values({
          revisionId: publishedId,
          sectionKey: "faq",
          sectionType: "faq",
          sortOrder: 0,
          contentJson: content,
        });

        const draftResult = await tx.insert(pageRevisions).values({
          pageId: page.id,
          revisionNumber: 2,
          status: "draft",
          title: dictionary.pages.faq,
          metaTitle: dictionary.pages.faq,
          metaDescription: dictionary.faqPage.description,
        });
        const draftId = BigInt(draftResult[0].insertId);
        await tx.insert(pageSections).values({
          revisionId: draftId,
          sectionKey: "faq",
          sectionType: "faq",
          sortOrder: 0,
          contentJson: content,
        });
        await tx.insert(pageRevisionPointers).values({
          pageId: page.id,
          draftRevisionId: draftId,
          publishedRevisionId: publishedId,
        });
      }
    });
  } finally {
    await releaseDataLock(connection);
    connection.release();
  }
  console.log("FAQ content seed complete.");
}

seedFaq().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closePool());
