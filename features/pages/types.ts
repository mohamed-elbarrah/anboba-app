import type { Locale } from "@/lib/locales";
import type { Page, PageRevision, PageSection } from "@/db/schema";
import type { Dictionary } from "@/lib/dictionaries";
import type { LegalDocument } from "@/content/legal/policies";
import type { SectionContentMap } from "./content-adapter";

export type PageSlug = "" | "about" | "contact" | "join-us" | "faq" | "policies";
export type CmsLocale = Locale;
export type PageContent = Dictionary;
export type PoliciesContent = {
  hero: Dictionary["pageTitle"];
  documents: readonly LegalDocument[];
};
export type PageRecord = Page & {
  revision: PageRevision;
  sections: PageSection[];
};

export type SectionKey =
  | "hero" | "service_overview" | "statistics" | "why_choose_us"
  | "service_benefits" | "join_application" | "faq_support" | "faq"
  | "vision_mission" | "contact" | "partner_registration" | "policies";

export type SectionContent = {
  [K in SectionKey]: { key: K; type: K; sortOrder: number; formId: string | null; content: SectionContentMap[K] }
}[SectionKey];

export type ContentSection = SectionContent;

/** Serialized editor DTO; safe to cross a Server Component/action boundary. */
export type EditorDocument = {
  pageId: string;
  locale: CmsLocale;
  slug: PageSlug;
  revisionId: string;
  revisionToken: string;
  // Publication state is independent from the revision loaded for editing.
  status: "draft" | "published";
  hasPublishedRevision: boolean;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  sections: ContentSection[];
};
