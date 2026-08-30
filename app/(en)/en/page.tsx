import type { Metadata } from "next";

import { HeroSection } from "@/components/public/sections/hero-section";
import { ServiceOverviewSection } from "@/components/public/sections/service-overview-section";
import { StatisticsSection } from "@/components/public/sections/statistics-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { ServiceBenefitsSection } from "@/components/public/sections/service-benefits-section";
import { JoinApplicationSection } from "@/components/public/sections/join-application-section";
import { FaqSupportSection } from "@/components/public/sections/faq-support-section";
import { getDictionary } from "@/lib/dictionaries";
import { getPublicFooterData } from "@/lib/public-footer";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Order your gas cylinder from ANBOBA and get reliable delivery, installation, and safety checks at your doorstep.",
};

export default async function EnglishHome() {
  const dictionary = await getDictionary("en");
  const footer = getPublicFooterData("en", dictionary);
  return (
    <main>
      <HeroSection content={dictionary.hero} locale="en" />
      <ServiceOverviewSection content={dictionary.serviceOverview} locale="en" />
      <StatisticsSection content={dictionary.statistics} locale="en" />
      <WhyChooseUsSection content={dictionary.whyChooseUs} locale="en" />
      <ServiceBenefitsSection content={dictionary.serviceBenefits} locale="en" />
      <JoinApplicationSection content={dictionary.joinApplication} locale="en" />
      <FaqSupportSection
        content={dictionary.faqSupport}
        faqHref="/en/faq"
        supportHref={footer.whatsappHref}
        locale="en"
      />
    </main>
  );
}
