import { HeroSection } from "@/components/public/sections/hero-section";
import { ServiceOverviewSection } from "@/components/public/sections/service-overview-section";
import { StatisticsSection } from "@/components/public/sections/statistics-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { ServiceBenefitsSection } from "@/components/public/sections/service-benefits-section";
import { JoinApplicationSection } from "@/components/public/sections/join-application-section";
import { FaqSupportSection } from "@/components/public/sections/faq-support-section";
import { getDictionary } from "@/lib/dictionaries";
import { getPublicFooterData } from "@/lib/public-footer";

export default async function ArabicHome() {
  const dictionary = await getDictionary("ar");
  const footer = getPublicFooterData("ar", dictionary);

  return (
    <main>
      <HeroSection content={dictionary.hero} locale="ar" />
      <ServiceOverviewSection content={dictionary.serviceOverview} locale="ar" />
      <StatisticsSection content={dictionary.statistics} locale="ar" />
      <WhyChooseUsSection content={dictionary.whyChooseUs} locale="ar" />
      <ServiceBenefitsSection content={dictionary.serviceBenefits} locale="ar" />
      <JoinApplicationSection content={dictionary.joinApplication} locale="ar" />
      <FaqSupportSection
        content={dictionary.faqSupport}
        faqHref="/ar/faq"
        supportHref={footer.whatsappHref}
        locale="ar"
      />
    </main>
  );
}
