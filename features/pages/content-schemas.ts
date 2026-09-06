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
const details = z.array(z.object({ kind: z.enum(["phone", "email", "location", "hours"]), value: nonEmpty, href: contactUrl.optional() }));
const contactValidation = z.object({ fullNameMin: nonEmpty, fullNameMax: nonEmpty, phone: nonEmpty, messageMin: nonEmpty, messageMax: nonEmpty });
const joinValidation = z.object({ fullNameMin: nonEmpty, fullNameMax: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty, experience: nonEmpty, transport: nonEmpty, nationalId: nonEmpty, drivingLicense: nonEmpty, fileSize: nonEmpty, fileType: nonEmpty });
const partnerValidation = z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty });

export const heroSchema = z.object({ headingStart: nonEmpty, headingHighlightGas: nonEmpty, headingMiddle: nonEmpty, headingHighlightHome: nonEmpty, description: nonEmpty, cta: nonEmpty, showcase: z.object({ heading: nonEmpty, guaranteeLabel: nonEmpty, guarantees: z.array(nonEmpty), phoneLeftAlt: nonEmpty, phoneRightAlt: nonEmpty }).optional() });
export const serviceOverviewSchema = z.object({ highlightedHeading: nonEmpty, primaryHeading: nonEmpty, primaryHeadingStart: nonEmpty, primaryHeadingHighlight: nonEmpty, description: nonEmpty, imageAlt: nonEmpty });
export const statisticsSchema = z.object({ heading: nonEmpty, items: z.array(z.object({ value: nonEmpty, label: nonEmpty })) });
export const whyChooseUsSchema = z.object({ eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, subtitle: nonEmpty, cardHeading: nonEmpty, cardParagraph: nonEmpty, featuresHeading: nonEmpty, features: z.array(nonEmpty), imageAlt: nonEmpty });
export const visionMissionSchema = z.object({ vision: z.object({ heading: nonEmpty, description: nonEmpty }), mission: z.object({ heading: nonEmpty, description: nonEmpty }) });
export const serviceBenefitsSchema = z.object({ eyebrow: nonEmpty, headingHighlight: nonEmpty, headingRest: nonEmpty, subtitle: nonEmpty, items: z.array(z.object({ title: nonEmpty, description: nonEmpty, icon: z.enum(["clock", "shield", "send", "headset"]) })) });
export const joinApplicationSchema = z.object({ validation: joinValidation, heading: nonEmpty, description: nonEmpty, placeholders: z.object({ fullName: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, fields: z.object({ fullName: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty, experienceYears: nonEmpty, transportType: nonEmpty, nationalId: nonEmpty, drivingLicense: nonEmpty }), selectPlaceholders: z.object({ experienceYears: nonEmpty, transportType: nonEmpty }), experienceOptions: z.array(nonEmpty), transportOptions: z.array(nonEmpty), fileHint: nonEmpty, submit: nonEmpty, benefits: z.array(nonEmpty), note: nonEmpty, success: nonEmpty });
export const faqSupportSchema = z.object({ faq: z.object({ heading: nonEmpty, description: nonEmpty, cta: nonEmpty, href: internalOrHttpsUrl }), support: z.object({ heading: nonEmpty, description: nonEmpty, cta: nonEmpty, href: internalOrHttpsUrl }) });
export const contactSchema = z.object({ validation: contactValidation, eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, description: nonEmpty, details, fields: z.object({ fullName: nonEmpty, phone: nonEmpty, message: nonEmpty }), placeholders: z.object({ fullName: nonEmpty, phone: nonEmpty, message: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, submit: nonEmpty, success: nonEmpty });
export const partnerRegistrationSchema = z.object({ validation: partnerValidation, eyebrow: nonEmpty, headingStart: nonEmpty, headingHighlight: nonEmpty, description: nonEmpty, fields: z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), placeholders: z.object({ company: nonEmpty, phone: nonEmpty, email: nonEmpty, city: nonEmpty }), countryCode: nonEmpty, countryLabel: nonEmpty, cityOptions: z.array(nonEmpty), submit: nonEmpty, success: nonEmpty });
export const policiesSchema = z.object({ hero: z.object({ eyebrow: nonEmpty, heading: nonEmpty, description: nonEmpty }), documents: z.array(z.object({ slug: z.enum(["privacy", "terms", "refunds"]), title: nonEmpty, summary: nonEmpty, sections: z.array(z.object({ heading: nonEmpty, paragraphs: z.array(nonEmpty).optional(), items: z.array(nonEmpty).optional() })) })) });

export const sectionContentSchemas = { hero: heroSchema, service_overview: serviceOverviewSchema, statistics: statisticsSchema, why_choose_us: whyChooseUsSchema, service_benefits: serviceBenefitsSchema, join_application: joinApplicationSchema, faq_support: faqSupportSchema, vision_mission: visionMissionSchema, contact: contactSchema, partner_registration: partnerRegistrationSchema, policies: policiesSchema } as const;
export function parseSectionContent<K extends keyof typeof sectionContentSchemas>(key: K, value: unknown): z.infer<(typeof sectionContentSchemas)[K]> {
  return sectionContentSchemas[key].parse(value) as z.infer<(typeof sectionContentSchemas)[K]>;
}
