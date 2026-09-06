import type { SectionKey } from "./types";

/** Fixed, code-owned section contracts. Editors may change content, never this order or design. */
export const sectionConfig = {
  hero: { type: "hero", label: "Hero" },
  service_overview: { type: "service_overview", label: "Service overview" },
  statistics: { type: "statistics", label: "Statistics" },
  why_choose_us: { type: "why_choose_us", label: "Why choose us" },
  service_benefits: { type: "service_benefits", label: "Service benefits" },
  join_application: { type: "join_application", label: "Join application" },
  faq_support: { type: "faq_support", label: "FAQ and support" },
  vision_mission: { type: "vision_mission", label: "Vision and mission" },
  contact: { type: "contact", label: "Contact" },
  partner_registration: { type: "partner_registration", label: "Partner registration" },
  policies: { type: "policies", label: "Policies" },
} satisfies Record<SectionKey, { type: SectionKey; label: string }>;

export type PageDefinition = { slug: string; sections: readonly SectionKey[] };
