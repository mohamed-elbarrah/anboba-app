import "server-only";

import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { pageRevisionPointers, pageRevisions, pages } from "@/db/schema";

export const dashboardPageIdentities = [
  { slug: "", name: "Home", description: "Primary landing page" },
  { slug: "about", name: "About", description: "Company and mission" },
  { slug: "contact", name: "Contact", description: "Contact information" },
  { slug: "join-us", name: "Join Us", description: "Partner registration" },
  { slug: "policies", name: "Policies", description: "Legal documents" },
] as const;

type Availability = "published" | "draft" | "archived" | "invalid" | "not-configured";
export type DashboardPage = (typeof dashboardPageIdentities)[number] & {
  locales: {
    ar: { id: string | null; availability: Availability; updatedAt: Date | null };
    en: { id: string | null; availability: Availability; updatedAt: Date | null };
  };
};

/** Reads CMS state on the server and folds locale rows into fixed page identities. */
export async function getDashboardPages(): Promise<DashboardPage[]> {
  const db = getDb();
  const [pageRows, pointerRows, revisionRows] = await Promise.all([
    db.select().from(pages).orderBy(asc(pages.slug)),
    db.select().from(pageRevisionPointers),
    db.select().from(pageRevisions),
  ]);

  const revisions = new Map(revisionRows.map((revision) => [revision.id.toString(), revision]));
  const pointers = new Map(pointerRows.map((pointer) => [pointer.pageId.toString(), pointer]));
  const byLocaleAndSlug = new Map(pageRows.map((page) => [`${page.locale}:${page.slug}`, page]));

  return dashboardPageIdentities.map((identity) => {
    const localeState = (locale: "ar" | "en") => {
      const page = byLocaleAndSlug.get(`${locale}:${identity.slug}`);
      if (!page) return { id: null, availability: "not-configured" as const, updatedAt: null };
      const pointer = pointers.get(page.id.toString());
      if (!pointer) return { id: page.id.toString(), availability: "not-configured" as const, updatedAt: page.updatedAt ?? null };

      // A pointer is configuration, even when it points at a missing revision.
      // Keep that state visible instead of presenting it as an empty page.
      const revisionId = pointer.publishedRevisionId ?? pointer.draftRevisionId;
      if (!revisionId) return { id: page.id.toString(), availability: "invalid" as const, updatedAt: page.updatedAt ?? null };

      const revision = revisions.get(revisionId.toString());
      if (!revision) return { id: page.id.toString(), availability: "invalid" as const, updatedAt: page.updatedAt ?? null };

      return {
        id: page.id.toString(),
        availability: revision.status === "published" ? "published" as const : revision.status === "archived" ? "archived" as const : "draft" as const,
        updatedAt: revision.updatedAt ?? page.updatedAt ?? null,
      };
    };

    return { ...identity, locales: { ar: localeState("ar"), en: localeState("en") } };
  });
}
