import "server-only";

import { getDictionary, type Dictionary } from "@/lib/dictionaries";
import { getArabicLegalDocument, getEnglishLegalDocument, type LegalDocument, type LegalDocumentSlug } from "@/content/legal/policies";
import { getPublishedPolicies, getPublishedPolicy } from "@/features/policies/queries";
import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";
import { getPage } from "./queries";
import type { AdaptedPageContent, HeroShowcaseMedia } from "./content-adapter";
import { resolvePublicImagePath } from "@/features/media/queries";

/**
 * Public CMS boundary. Routes use this rather than knowing about Drizzle or
 * the database shape. The development fallback exists for a fresh checkout
 * before the reviewed content seed has been run; production failures remain
 * visible and are never replaced with stale source content.
 */
export async function getPublishedPublicPage(locale: Locale, slug: string): Promise<AdaptedPageContent> {
  try {
    const page = await getPage(locale, slug, "published");
    // An empty database is the supported fresh-checkout development state.
    if (page) {
      return {
        ...page,
        heroShowcaseMedia: await resolveHeroShowcaseMedia(page.sections.hero),
        homeImageMedia: await resolveHomeImageMedia(page.sections.service_overview, page.sections.why_choose_us),
      };
    }
    if (process.env.NODE_ENV !== "development") {
      throw new Error(`Published CMS page is missing: ${locale}:${slug || "home"}`);
    }
    console.warn(`[cms] Using development fallback for unseeded page ${locale}:${slug || "home"}`);
    return await fallbackPage(locale, slug);
  } catch (error) {
    if (process.env.NODE_ENV !== "development" || !isUnavailableDatabaseError(error)) throw error;
    console.warn(`[cms] Using development fallback because the database is unavailable`, error);
    return await fallbackPage(locale, slug);
  }
}

/** Only infrastructure/setup failures may use the development content fallback. */
function isUnavailableDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  return /^(DB_HOST|DB_NAME|DB_USER|DB_PASSWORD) is required to connect to MySQL$/.test(error.message) || (code !== undefined && [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ER_ACCESS_DENIED_ERROR",
    "ER_BAD_DB_ERROR",
    "ER_NO_SUCH_TABLE",
  ].includes(code));
}

export async function getPublishedPageMetadata(
  locale: Locale,
  slug: string,
  fallback: Metadata = {},
): Promise<Metadata> {
  const page = await getPublishedPublicPage(locale, slug);
  return {
    ...fallback,
    title: page.revision.metaTitle || page.revision.title || fallback.title,
    description: page.revision.metaDescription || fallback.description,
  };
}

async function fallbackPage(locale: Locale, slug: string): Promise<AdaptedPageContent> {
  // This is reached only for an empty/unseeded database or a development-only
  // infrastructure failure; CMS reference/content errors are rethrown above.
  const dictionary = await getDictionary(locale);
  const sections = fallbackSections(dictionary, locale, slug);
  return {
    revision: fallbackRevision(slug, dictionary),
    sections,
    heroShowcaseMedia: { left: null, right: null },
    homeImageMedia: {
      serviceOverview: (dictionary.serviceOverview.imageUrl ?? "/images/anboba-img.png"),
      whyChooseUs: (dictionary.whyChooseUs.imageUrl ?? "/images/anboba-img.png"),
    },
  } as AdaptedPageContent;
}

function fallbackRevision(slug: string, dictionary: Dictionary) {
  return {
    id: BigInt(0), pageId: BigInt(0), revisionNumber: 0, status: "published" as const,
    title: slug === "policies" ? dictionary.pageTitle.heading : dictionary.pages[slug === "" ? "home" : slug === "join-us" ? "joinUs" : slug as "about" | "contact" | "policies"],
    metaTitle: null, metaDescription: null,
    createdAt: new Date(0), updatedAt: new Date(0),
  };
}

function fallbackSections(dictionary: Dictionary, locale: Locale, slug: string) {
  const legal = locale === "ar" ? importLegal("ar") : importLegal("en");
  const source: Record<string, unknown> = {
    hero: dictionary.hero, service_overview: dictionary.serviceOverview,
    statistics: dictionary.statistics, why_choose_us: dictionary.whyChooseUs,
    service_benefits: dictionary.serviceBenefits, join_application: dictionary.joinApplication,
    faq_support: dictionary.faqSupport, vision_mission: dictionary.aboutVisionMission,
    contact: dictionary.contact, partner_registration: dictionary.partnerRegistration,
    policies: { hero: dictionary.pageTitle, documents: legal },
  };
  const keys = slug === "" ? ["hero", "service_overview", "statistics", "why_choose_us", "service_benefits", "join_application", "faq_support"] : slug === "about" ? ["why_choose_us", "vision_mission"] : slug === "contact" ? ["contact"] : slug === "join-us" ? ["partner_registration"] : ["policies"];
  return Object.fromEntries(keys.map((key) => [key, source[key]])) as AdaptedPageContent["sections"];
}

async function resolveHomeImageMedia(
  serviceOverview: Dictionary["serviceOverview"] | undefined,
  whyChooseUs: Dictionary["whyChooseUs"] | undefined,
) {
  const [overview, why] = await Promise.all([
    resolvePublicImagePath(serviceOverview?.imageMediaId, serviceOverview?.imageUrl),
    resolvePublicImagePath(whyChooseUs?.imageMediaId, whyChooseUs?.imageUrl),
  ]);
  return {
    serviceOverview: overview ?? "/images/anboba-img.png",
    whyChooseUs: why ?? "/images/anboba-img.png",
  };
}

async function resolveHeroShowcaseMedia(hero: Dictionary["hero"] | undefined): Promise<HeroShowcaseMedia> {
  const showcase = hero?.showcase;
  if (!showcase) return { left: null, right: null };
  const [left, right] = await Promise.all([
    resolvePublicImagePath(showcase.phoneLeftMediaId, showcase.phoneLeftImageUrl),
    resolvePublicImagePath(showcase.phoneRightMediaId, showcase.phoneRightImageUrl),
  ]);
  return { left, right };
}

function importLegal(locale: "ar" | "en") {
  return locale === "ar" ? [getArabicLegalDocument("privacy"), getArabicLegalDocument("terms"), getArabicLegalDocument("refunds")].filter(Boolean) : [getEnglishLegalDocument("privacy"), getEnglishLegalDocument("terms"), getEnglishLegalDocument("refunds")].filter(Boolean);
}

function richTextToSections(content: unknown) {
  const sections: { heading: string; paragraphs: string[]; items?: string[] }[] = [];
  for (const node of (content as { content?: unknown[] })?.content ?? []) {
    const value = node as { type?: string; text?: string; content?: unknown[] };
    const text = value.text ?? (value.content as { text?: string }[] | undefined)?.map((item) => item.text ?? "").join("") ?? "";
    if (value.type === "heading") sections.push({ heading: text, paragraphs: [] });
    else if (value.type === "paragraph" && text) (sections.at(-1) ?? (sections.push({ heading: "", paragraphs: [] }), sections.at(-1)!)).paragraphs.push(text);
    else if ((value.type === "bulletList" || value.type === "orderedList") && value.content) (sections.at(-1) ?? (sections.push({ heading: "", paragraphs: [] }), sections.at(-1)!)).items = (value.content as { content?: { content?: { text?: string }[] }[] }[]).map((item) => (item.content ?? []).flatMap((paragraph) => paragraph.content ?? []).map((part) => part.text ?? "").join(""));
  }
  return sections.filter((section) => section.heading || section.paragraphs.length || section.items?.length).map((section) => ({ heading: section.heading || "Content", paragraphs: section.paragraphs, items: section.items }));
}

function toLegalDocument(policy: Awaited<ReturnType<typeof getPublishedPolicies>>[number]): LegalDocument {
  return { slug: policy.slug as LegalDocumentSlug, title: policy.title, summary: policy.summary, sections: richTextToSections(policy.content) };
}

export async function getPublishedLegalDocuments(locale: Locale) {
  try { return (await getPublishedPolicies(locale)).map(toLegalDocument); }
  catch (error) { if (process.env.NODE_ENV !== "development") throw error; return (await getPublishedPublicPage(locale, "policies")).sections.policies.documents; }
}

export async function getPublishedLegalDocument(locale: Locale, slug: LegalDocumentSlug) {
  try { const document = await getPublishedPolicy(locale, slug); if (document) return toLegalDocument(document); }
  catch (error) { if (process.env.NODE_ENV !== "development") throw error; }
  const documents = await getPublishedLegalDocuments(locale);
  const document = documents.find((item) => item.slug === slug);
  if (document) return document;
  throw new Error(`Published CMS legal document is missing: ${locale}:policies:${slug}`);
}
