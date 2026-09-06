import type { Metadata } from "next";

import { HeroSection } from "@/components/public/sections/hero-section";
import { ServiceOverviewSection } from "@/components/public/sections/service-overview-section";
import { StatisticsSection } from "@/components/public/sections/statistics-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { ServiceBenefitsSection } from "@/components/public/sections/service-benefits-section";
import { JoinApplicationSection } from "@/components/public/sections/join-application-section";
import { FlexibleFormRenderer } from "@/components/public/flexible-form-renderer";
import { isFlexibleForm } from "@/features/forms/renderer-adapter";
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
      {isFlexibleForm(page.sections.join_application, "en") ? <section className="bg-background px-5 py-16 sm:px-8 sm:py-24" dir="ltr"><div className="mx-auto max-w-[900px] rounded-[2rem] border border-white/90 bg-white/35 p-6 shadow-xl sm:p-8"><FlexibleFormRenderer definition={page.sections.join_application} locale="en" /></div></section> : <JoinApplicationSection content={page.sections.join_application} locale="en" />}
      <FaqSupportSection
        content={page.sections.faq_support}
        faqHref="/en/faq"
        supportHref={footer.whatsappHref}
        locale="en"
      />
    </main>
  );
}
