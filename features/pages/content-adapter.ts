import type { Dictionary } from "@/lib/dictionaries";
import type { LegalDocument } from "@/content/legal/policies";
import type { PageRevision, PageSection } from "@/db/schema";
import { pageDefinition } from "./page-map";
import { sectionConfig } from "./section-config";
import type { SectionKey } from "./types";
import { parseSectionContent, parseSectionOwnedFormContent, type SectionOwnedFormKey } from "./content-schemas";
import type { FormRendererKey } from "@/features/forms/registry-core";

/** The CMS boundary is deliberately typed to the props consumed by public sections. */
export type SectionContentMap = {
  hero: Dictionary["hero"];
  service_overview: Dictionary["serviceOverview"];
  statistics: Dictionary["statistics"];
  why_choose_us: Dictionary["whyChooseUs"];
  service_benefits: Dictionary["serviceBenefits"];
  join_application: Dictionary["joinApplication"];
  faq_support: Dictionary["faqSupport"];
  faq: Dictionary["faqPage"];
  vision_mission: Dictionary["aboutVisionMission"];
  contact: Dictionary["contact"];
  partner_registration: Dictionary["partnerRegistration"];
  policies: { hero: Dictionary["pageTitle"]; documents: readonly LegalDocument[] };
};

export type AdaptedSections<K extends SectionKey = SectionKey> = {
  [P in K]: SectionContentMap[P];
};
export type HeroShowcaseMedia = { left: string | null; right: string | null };
export type HomeImageMedia = { serviceOverview: string | null; whyChooseUs: string | null };
export type AdaptedPageContent = {
  revision: PageRevision;
  sections: AdaptedSections;
  /** Resolved on the server; absent for callers that only adapt CMS sections. */
  heroShowcaseMedia?: HeroShowcaseMedia;
  homeImageMedia?: HomeImageMedia;
};

function expectedDefinition(slug: string) {
  const definition = pageDefinition(slug);
  if (!definition) throw new Error(`Cannot adapt content: unknown page slug "${slug}"`);
  return definition;
}

/** Validates the complete fixed document, not merely each section's JSON. */
export type ResolvedForm = { rendererKey: FormRendererKey; config: unknown };

/**
 * Compose section-owned copy with a published form-owned runtime contract.
 * A form reference is authoritative; content_json is only read for the
 * section-owned projection. The optional map is intentionally server-only.
 */
export function adaptSections<K extends SectionKey>(slug: string, sections: readonly PageSection[], resolvedForms?: ReadonlyMap<string, ResolvedForm>): AdaptedSections<K> {
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
    if (section.formId !== null && (section.sectionKey === "contact" || section.sectionKey === "join_application" || section.sectionKey === "partner_registration")) {
      const resolved = resolvedForms?.get(section.id.toString());
      if (!resolved) throw new Error(`Missing resolved form contract for ${slug || "home"}:${section.sectionKey}`);
      // Flexible definitions are consumed by FlexibleFormRenderer directly.
      if (resolved.rendererKey === "generic" || (resolved.config && typeof resolved.config === "object" && (resolved.config as { rendererMode?: unknown }).rendererMode === "flexible")) {
        result[section.sectionKey] = resolved.config as SectionContentMap[typeof section.sectionKey];
      } else {
        const owned = parseSectionOwnedFormContent(section.sectionKey as SectionOwnedFormKey, section.contentJson);
        result[section.sectionKey] = { ...(resolved.config as object), ...owned } as SectionContentMap[typeof section.sectionKey];
      }
    } else {
      // Explicitly isolated compatibility boundary for historical form rows.
      if (BUILT_IN_FORM_SECTIONS.includes(section.sectionKey as typeof BUILT_IN_FORM_SECTIONS[number])) {
        console.warn(`[cms:legacy-form-fallback] ${slug || "home"}:${section.sectionKey} has no formId; reading legacy content_json`);
      }
      result[section.sectionKey] = parseSectionContent(section.sectionKey as keyof typeof import("./content-schemas").sectionContentSchemas, section.contentJson);
    }
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
      console.warn(`[cms:legacy-form-fallback] ${slug || "home"}:${section.sectionKey} has no formId`);
    }
  }
}

export function adaptPageContent<K extends Exclude<SectionKey, never>>(revision: PageRevision, sections: readonly PageSection[], slug: string, resolvedForms?: ReadonlyMap<string, ResolvedForm>): { revision: PageRevision; sections: AdaptedSections<K> } {
  assertPublicFormReferences(sections, slug);
  return { revision, sections: adaptSections<K>(slug, sections, resolvedForms) };
}

/** Editor projection: form-owned fields never cross into the page editor DTO. */
export function adaptEditorSections<K extends SectionKey>(slug: string, sections: readonly PageSection[]): AdaptedSections<K> {
  const result: Partial<Record<SectionKey, SectionContentMap[SectionKey]>> = {};
  for (const section of sections) {
    if (section.formId !== null && (section.sectionKey === "contact" || section.sectionKey === "join_application" || section.sectionKey === "partner_registration")) {
      result[section.sectionKey] = parseSectionOwnedFormContent(section.sectionKey as SectionOwnedFormKey, section.contentJson) as SectionContentMap[typeof section.sectionKey];
    } else if (section.formId === null && (section.sectionKey === "contact" || section.sectionKey === "join_application" || section.sectionKey === "partner_registration")) {
      throw new Error(`Cannot edit legacy form section without formId: ${slug || "home"}:${section.sectionKey}`);
    } else {
      result[section.sectionKey] = parseSectionContent(section.sectionKey as keyof typeof import("./content-schemas").sectionContentSchemas, section.contentJson);
    }
  }
  return result as AdaptedSections<K>;
}

export function adaptPolicies(hero: Dictionary["pageTitle"], documents: readonly LegalDocument[]) {
  return { hero, documents };
}
