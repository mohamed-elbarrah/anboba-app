"use client";

import { ContactSection } from "@/components/public/sections/contact-section";
import { FaqSupportSection } from "@/components/public/sections/faq-support-section";
import { HeroSection } from "@/components/public/sections/hero-section";
import { JoinApplicationSection } from "@/components/public/sections/join-application-section";
import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { ServiceBenefitsSection } from "@/components/public/sections/service-benefits-section";
import { ServiceOverviewSection } from "@/components/public/sections/service-overview-section";
import { StatisticsSection } from "@/components/public/sections/statistics-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { AboutVisionMissionSection } from "@/components/public/sections/about-vision-mission-section";
import { LegalPolicyOverview } from "@/components/public/legal-policy";
import type { EditorDocument, SectionKey } from "@/features/pages/types";
import type { SectionContentMap } from "@/features/pages/content-adapter";

type Props = { document: EditorDocument; device: "desktop" | "tablet" | "mobile" };

export function PagePreview({ document, device }: Props) {
  const width = device === "desktop" ? "w-full" : device === "tablet" ? "w-[768px] max-w-full" : "w-[390px] max-w-full";
  const content = Object.fromEntries(document.sections.map((section) => [section.key, section.content])) as Partial<SectionContentMap>;
  const locale = document.locale;
  return <div className="overflow-auto rounded-lg border bg-muted/20 p-2">
    <div className={`${width} mx-auto origin-top bg-background shadow-sm`} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div
        className="pointer-events-none select-none"
        inert
        aria-label="Read-only page preview"
        onKeyDown={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
      >
        <PreviewSections content={content} slug={document.slug} locale={locale} />
      </div>
    </div>
  </div>;
}

function PreviewSections({ content, slug, locale }: { content: Partial<SectionContentMap>; slug: EditorDocument["slug"]; locale: "ar" | "en" }) {
  const faq = content.faq_support;
  const footerHref = locale === "ar" ? "https://wa.me/966550500055" : "https://wa.me/966550500055";
  if (slug === "") return <>
    {content.hero && <HeroSection content={content.hero} locale={locale} preview />}
    {content.service_overview && <ServiceOverviewSection content={content.service_overview} locale={locale} />}
    {content.statistics && <StatisticsSection content={content.statistics} locale={locale} />}
    {content.why_choose_us && <WhyChooseUsSection content={content.why_choose_us} locale={locale} />}
    {content.service_benefits && <ServiceBenefitsSection content={content.service_benefits} locale={locale} />}
    {content.join_application && <JoinApplicationSection content={content.join_application} locale={locale} preview />}
    {faq && <FaqSupportSection content={faq} faqHref="#preview" supportHref={footerHref} locale={locale} preview />}
  </>;
  if (slug === "about" && content.why_choose_us && content.vision_mission) return <><WhyChooseUsSection content={content.why_choose_us} variant="about" headingLevel="h1" locale={locale} /><AboutVisionMissionSection content={content.vision_mission} locale={locale} /></>;
  if (slug === "contact" && content.contact) return <ContactSection content={content.contact} locale={locale} preview />;
  if (slug === "join-us" && content.partner_registration) return <PartnerRegistrationSection content={content.partner_registration} locale={locale} preview />;
  if (slug === "policies" && content.policies) return <LegalPolicyOverview content={content.policies} locale={locale} preview />;
  return <p className="p-8 text-center text-muted-foreground">Preview content is incomplete.</p>;
}

export const sectionNames: Record<SectionKey, string> = {
  hero: "Hero", service_overview: "Service overview", statistics: "Statistics", why_choose_us: "Why choose us", service_benefits: "Service benefits", join_application: "Join application", faq_support: "FAQ and support", vision_mission: "Vision and mission", contact: "Contact", partner_registration: "Partner registration", policies: "Policies",
};
