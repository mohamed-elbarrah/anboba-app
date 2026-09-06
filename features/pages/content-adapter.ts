import type { Dictionary } from "@/lib/dictionaries";
import type { LegalDocument } from "@/content/legal/policies";
import type { PageRevision, PageSection } from "@/db/schema";
import { pageDefinition } from "./page-map";
import { sectionConfig } from "./section-config";
import type { SectionKey } from "./types";
import { parseSectionContent } from "./content-schemas";

/** The CMS boundary is deliberately typed to the props consumed by public sections. */
export type SectionContentMap = {
  hero: Dictionary["hero"];
  service_overview: Dictionary["serviceOverview"];
  statistics: Dictionary["statistics"];
  why_choose_us: Dictionary["whyChooseUs"];
  service_benefits: Dictionary["serviceBenefits"];
  join_application: Dictionary["joinApplication"];
  faq_support: Dictionary["faqSupport"];
  vision_mission: Dictionary["aboutVisionMission"];
  contact: Dictionary["contact"];
  partner_registration: Dictionary["partnerRegistration"];
  policies: { hero: Dictionary["pageTitle"]; documents: readonly LegalDocument[] };
};

export type AdaptedSections<K extends SectionKey = SectionKey> = {
  [P in K]: SectionContentMap[P];
};
export type AdaptedPageContent = { revision: PageRevision; sections: AdaptedSections };

function expectedDefinition(slug: string) {
  const definition = pageDefinition(slug);
  if (!definition) throw new Error(`Cannot adapt content: unknown page slug "${slug}"`);
  return definition;
}

/** Validates the complete fixed document, not merely each section's JSON. */
export function adaptSections<K extends SectionKey>(slug: string, sections: readonly PageSection[]): AdaptedSections<K> {
  const expected = expectedDefinition(slug).sections;
  if (sections.length !== expected.length) {
    throw new Error(`Invalid ${slug || "home"} page sections: expected ${expected.length}, received ${sections.length}`);
  }

  const result: Partial<Record<SectionKey, SectionContentMap[SectionKey]>> = {};
  sections.forEach((section, index) => {
    const key = expected[index];
    if (section.sectionKey !== key || section.sectionType !== sectionConfig[key].type || section.sortOrder !== index) {
      throw new Error(`Invalid ${slug || "home"} page section at position ${index}: expected ${key}/${sectionConfig[key].type}`);
    }
    if (result[section.sectionKey]) throw new Error(`Duplicate section "${section.sectionKey}" on ${slug || "home"} page`);
    result[section.sectionKey] = parseSectionContent(section.sectionKey, section.contentJson);
  });
  return result as AdaptedSections<K>;
}

const BUILT_IN_FORM_SECTIONS = ["contact", "join_application", "partner_registration"] as const;

/**
 * Public form sections are references to published system forms. They must not
 * be adapted from page_sections.contentJson when their reference is absent.
 */
export function assertPublicFormReferences(sections: readonly PageSection[], slug: string) {
  for (const section of sections) {
    if (BUILT_IN_FORM_SECTIONS.includes(section.sectionKey as typeof BUILT_IN_FORM_SECTIONS[number]) && section.formId == null) {
      throw new Error(`Built-in form reference is missing on ${slug || "home"}:${section.sectionKey}`);
    }
  }
}

export function adaptPageContent<K extends Exclude<SectionKey, never>>(revision: PageRevision, sections: readonly PageSection[], slug: string): { revision: PageRevision; sections: AdaptedSections<K> } {
  assertPublicFormReferences(sections, slug);
  return { revision, sections: adaptSections<K>(slug, sections) };
}

export function adaptPolicies(hero: Dictionary["pageTitle"], documents: readonly LegalDocument[]) {
  return { hero, documents };
}
