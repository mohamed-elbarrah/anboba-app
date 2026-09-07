import { z } from "zod";

const nonEmpty = z.string().min(1);

/** URLs editable through content must be navigable and non-executable. */
export const safeUrlSchema = z.string().superRefine((value, context) => {
  if (value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) {
    context.addIssue({ code: "custom", message: "URL contains invalid characters" });
    return;
  }

  if (value.startsWith("/")) {
    if (value.startsWith("//")) {
      context.addIssue({ code: "custom", message: "Only site-relative paths are allowed" });
      return;
    }
    try { new URL(value, "https://anboba.invalid"); } catch {
      context.addIssue({ code: "custom", message: "Malformed relative URL" });
    }
    return;
  }

  let parsed: URL;
  try { parsed = new URL(value); } catch {
    context.addIssue({ code: "custom", message: "Malformed URL" });
    return;
  }
  const validTel = parsed.protocol !== "tel:" || /^tel:\+?(?=[0-9().-]*[0-9])[0-9().-]+$/.test(value);
  const validMailto = parsed.protocol !== "mailto:" || /^mailto:[^@\s]+@[^@\s]+$/.test(value);
  const hasCredentials = parsed.protocol === "https:" && (parsed.username || parsed.password);
  if (!["https:", "tel:", "mailto:"].includes(parsed.protocol) || (parsed.protocol === "https:" && !parsed.hostname) || hasCredentials || !validTel || !validMailto) {
    context.addIssue({ code: "custom", message: "URL scheme or value is not allowed" });
  }
});
const internalOrHttpsUrl = safeUrlSchema.refine((value) => value.startsWith("/") || value.startsWith("https:"), "Only relative or https URLs are allowed");
const contactUrl = safeUrlSchema.refine((value) => value.startsWith("/") || /^(?:https:|tel:|mailto:)/.test(value), "Only https, tel, mailto, or relative URLs are allowed");
const fixedArray = <T extends z.ZodType>(schema: T, length: number) => z.array(schema).length(length);
const details = fixedArray(z.object({ kind: z.enum(["phone", "email", "location", "hours"]), value: nonEmpty, href: contactUrl.optional() }), 4);
const contactValidation = z.object({ fullNameMin: nonEmpty, fullNameMax: nonEmpty, phone: nonEmpty, messageMin: nonEmpty, messageMax: nonEmpty });
const joinValidation = z.object({ fullNameMin: nonEmpty, fullNameMax: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty, experience: nonEmpty, transport: nonEmpty, nationalId: nonEmpty, drivingLicense: nonEmpty, fileSize: nonEmpty, fileType: nonEmpty });
const partnerValidation = z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty });
const mediaId = z.string().regex(/^[1-9]\d*$/, "Media ID must be a positive integer");
/** Image sources may be existing site assets or HTTPS URLs. Media IDs remain the preferred source. */
const imageUrl = z.preprocess((value) => value === "" ? undefined : value, safeUrlSchema.refine((value) => (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https:"), "Only relative or HTTPS image URLs are allowed").optional());

export const heroSchema = z.object({ headingStart: nonEmpty, headingHighlightGas: nonEmpty, headingMiddle: nonEmpty, headingHighlightHome: nonEmpty, description: nonEmpty, cta: nonEmpty, showcase: z.object({ heading: nonEmpty, guaranteeLabel: nonEmpty, guarantees: fixedArray(nonEmpty, 4), phoneLeftAlt: nonEmpty, phoneRightAlt: nonEmpty, phoneLeftMediaId: mediaId.optional(), phoneRightMediaId: mediaId.optional(), phoneLeftImageUrl: imageUrl, phoneRightImageUrl: imageUrl }).optional() });
export const serviceOverviewSchema = z.object({ highlightedHeading: nonEmpty, primaryHeadingStart: nonEmpty, primaryHeadingHighlight: nonEmpty, description: nonEmpty, imageAlt: nonEmpty, imageMediaId: mediaId.optional(), imageUrl: imageUrl });
export const statisticsSchema = z.object({ heading: nonEmpty, items: fixedArray(z.object({ value: nonEmpty, label: nonEmpty }), 4) });
export const whyChooseUsSchema = z.object({ eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, subtitle: nonEmpty, cardHeading: nonEmpty, cardParagraph: nonEmpty, featuresHeading: nonEmpty, features: fixedArray(nonEmpty, 4), imageAlt: nonEmpty, imageMediaId: mediaId.optional(), imageUrl: imageUrl });
export const visionMissionSchema = z.object({ vision: z.object({ heading: nonEmpty, description: nonEmpty }), mission: z.object({ heading: nonEmpty, description: nonEmpty }) });
export const serviceBenefitsSchema = z.object({ eyebrow: nonEmpty, headingHighlight: nonEmpty, headingRest: nonEmpty, subtitle: nonEmpty, items: fixedArray(z.object({ title: nonEmpty, description: nonEmpty, icon: z.enum(["clock", "shield", "send", "headset"]) }), 4) });
export const joinApplicationSchema = z.object({ validation: joinValidation, heading: nonEmpty, description: nonEmpty, placeholders: z.object({ fullName: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, fields: z.object({ fullName: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty, experienceYears: nonEmpty, transportType: nonEmpty, nationalId: nonEmpty, drivingLicense: nonEmpty }), selectPlaceholders: z.object({ experienceYears: nonEmpty, transportType: nonEmpty }), experienceOptions: fixedArray(nonEmpty, 4), transportOptions: fixedArray(nonEmpty, 3), fileHint: nonEmpty, submit: nonEmpty, benefits: fixedArray(nonEmpty, 3), note: nonEmpty, success: nonEmpty });

/** Section-owned copy is deliberately separate from the reusable form contract. */
export const joinApplicationSectionSchema = joinApplicationSchema.pick({ heading: true, description: true, countryCode: true, countryLabel: true, benefits: true, note: true }).strict();
export const faqSupportSchema = z.object({ faq: z.object({ heading: nonEmpty, description: nonEmpty, cta: nonEmpty, href: internalOrHttpsUrl }), support: z.object({ heading: nonEmpty, description: nonEmpty, cta: nonEmpty, href: internalOrHttpsUrl }) });
export const contactSchema = z.object({ validation: contactValidation, eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, description: nonEmpty, details, fields: z.object({ fullName: nonEmpty, phone: nonEmpty, message: nonEmpty }), placeholders: z.object({ fullName: nonEmpty, phone: nonEmpty, message: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, submit: nonEmpty, success: nonEmpty });
export const contactSectionSchema = contactSchema.pick({ eyebrow: true, headingStart: true, headingHighlight: true, description: true, details: true, countryCode: true, countryLabel: true }).strict();
export const partnerRegistrationSchema = z.object({ validation: partnerValidation, eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, description: nonEmpty, fields: z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), placeholders: z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, cityOptions: fixedArray(nonEmpty, 6), submit: nonEmpty, success: nonEmpty });
export const partnerRegistrationSectionSchema = partnerRegistrationSchema.pick({ eyebrow: true, headingStart: true, headingHighlight: true, description: true, countryCode: true, countryLabel: true }).strict();
const legalDocumentSchema = z.object({ slug: z.enum(["privacy", "terms", "refunds"]), title: nonEmpty, summary: nonEmpty, sections: z.array(z.object({ heading: nonEmpty, paragraphs: z.array(nonEmpty).optional(), items: z.array(nonEmpty).optional() })) });
export const policiesSchema = z.object({ hero: z.object({ eyebrow: nonEmpty, heading: nonEmpty, description: nonEmpty }), documents: z.array(legalDocumentSchema).length(3).superRefine((documents, context) => {
  const slugs = documents.map((document) => document.slug);
  if (new Set(slugs).size !== 3) context.addIssue({ code: "custom", message: "Policies must contain privacy, terms, and refunds exactly once" });
}) });

export const sectionContentSchemas = { hero: heroSchema, service_overview: serviceOverviewSchema, statistics: statisticsSchema, why_choose_us: whyChooseUsSchema, service_benefits: serviceBenefitsSchema, join_application: joinApplicationSchema, faq_support: faqSupportSchema, vision_mission: visionMissionSchema, contact: contactSchema, partner_registration: partnerRegistrationSchema, policies: policiesSchema } as const;

export const sectionOwnedFormSchemas = { contact: contactSectionSchema, join_application: joinApplicationSectionSchema, partner_registration: partnerRegistrationSectionSchema } as const;
export type SectionOwnedFormKey = keyof typeof sectionOwnedFormSchemas;
const sectionOwnedKeys: Record<SectionOwnedFormKey, readonly string[]> = {
  contact: ["eyebrow", "headingStart", "headingHighlight", "description", "details", "countryCode", "countryLabel"],
  join_application: ["heading", "description", "countryCode", "countryLabel", "benefits", "note"],
  partner_registration: ["eyebrow", "headingStart", "headingHighlight", "description", "countryCode", "countryLabel"],
};
/** Runtime projection accepts historical full content_json but only retains section-owned keys. */
export function parseSectionOwnedFormContent<K extends SectionOwnedFormKey>(key: K, value: unknown): z.infer<(typeof sectionOwnedFormSchemas)[K]> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return sectionOwnedFormSchemas[key].parse(Object.fromEntries(sectionOwnedKeys[key].map((name) => [name, source[name]]))) as z.infer<(typeof sectionOwnedFormSchemas)[K]>;
}
/** Strict action/editor boundary: duplicated form-owned fields are rejected. */
export function parseStrictSectionOwnedFormContent<K extends SectionOwnedFormKey>(key: K, value: unknown): z.infer<(typeof sectionOwnedFormSchemas)[K]> {
  return sectionOwnedFormSchemas[key].parse(value) as z.infer<(typeof sectionOwnedFormSchemas)[K]>;
}
export function parseSectionContent<K extends keyof typeof sectionContentSchemas>(key: K, value: unknown): z.infer<(typeof sectionContentSchemas)[K]> {
  return sectionContentSchemas[key].parse(value) as z.infer<(typeof sectionContentSchemas)[K]>;
}
