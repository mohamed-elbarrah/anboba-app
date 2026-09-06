import type { Metadata } from "next";

import { HeroSection } from "@/components/public/sections/hero-section";
import { ServiceOverviewSection } from "@/components/public/sections/service-overview-section";
import { StatisticsSection } from "@/components/public/sections/statistics-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { ServiceBenefitsSection } from "@/components/public/sections/service-benefits-section";
import { JoinApplicationSection } from "@/components/public/sections/join-application-section";
import { FaqSupportSection } from "@/components/public/sections/faq-support-section";
import {
  getPublishedPageMetadata,
  getPublishedPublicPage,
} from "@/features/pages/public-content";
import { getPublicFooterData } from "@/lib/public-footer";
import { getDictionary } from "@/lib/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("en", "", {
    title: "Home",
    description:
      "Order your gas cylinder from ANBOBA and get reliable delivery, installation, and safety checks at your doorstep.",
  });
}

export default async function EnglishHome() {
  const page = await getPublishedPublicPage("en", "");
  const dictionary = await getDictionary("en");
  const footer = getPublicFooterData("en", dictionary);
  return (
    <main>
      <HeroSection content={page.sections.hero} locale="en" />
      <ServiceOverviewSection content={page.sections.service_overview} locale="en" />
      <StatisticsSection content={page.sections.statistics} locale="en" />
      <WhyChooseUsSection content={page.sections.why_choose_us} locale="en" />
      <ServiceBenefitsSection content={page.sections.service_benefits} locale="en" />
      <JoinApplicationSection content={page.sections.join_application} locale="en" />
      <FaqSupportSection
        content={page.sections.faq_support}
        faqHref="/en/faq"
        supportHref={footer.whatsappHref}
        locale="en"
      />
    </main>
  );
}
