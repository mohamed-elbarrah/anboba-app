import type { PageSlug, SectionKey } from "./types";
import type { PageDefinition } from "./section-config";

export const pageMap = {
  home: { slug: "", sections: ["hero", "service_overview", "statistics", "why_choose_us", "service_benefits", "join_application", "faq_support"] },
  about: { slug: "about", sections: ["why_choose_us", "vision_mission"] },
  contact: { slug: "contact", sections: ["contact"] },
  "join-us": { slug: "join-us", sections: ["partner_registration"] },
  faq: { slug: "faq", sections: ["faq"] },
  policies: { slug: "policies", sections: ["policies"] },
} as const satisfies Record<Exclude<PageSlug, ""> | "home", PageDefinition>;

export const pageDefinitions = Object.values(pageMap);
export function pageDefinition(slug: string): PageDefinition | undefined {
  return pageDefinitions.find((page) => page.slug === slug);
}
export function sectionOrder(slug: string): readonly SectionKey[] {
  return pageDefinition(slug)?.sections ?? [];
}
