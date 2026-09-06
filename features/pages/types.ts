import type { Locale } from "@/lib/locales";
import type { Page, PageRevision, PageSection } from "@/db/schema";
import type { Dictionary } from "@/lib/dictionaries";
import type { LegalDocument } from "@/content/legal/policies";

export type PageSlug = "" | "about" | "contact" | "join-us" | "policies";
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
  | "service_benefits" | "join_application" | "faq_support"
  | "vision_mission" | "contact" | "partner_registration" | "policies";

export type ContentSection = {
  key: SectionKey;
  type: SectionKey;
  sortOrder: number;
  content: unknown;
};
