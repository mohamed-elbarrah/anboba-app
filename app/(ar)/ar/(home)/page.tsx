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

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "", { title: "ANBOBA" });
}

export default async function ArabicHome() {
  const page = await getPublishedPublicPage("ar", "");
  // Header/footer remain code-owned; only page sections come from published CMS content.
  const dictionary = await getDictionary("ar");
  const footer = getPublicFooterData("ar", dictionary);

  return (
    <main>
      <HeroSection content={page.sections.hero} locale="ar" showcaseMedia={page.heroShowcaseMedia} />
      <ServiceOverviewSection content={page.sections.service_overview} locale="ar" />
      <StatisticsSection content={page.sections.statistics} locale="ar" />
      <WhyChooseUsSection content={page.sections.why_choose_us} locale="ar" />
      <ServiceBenefitsSection content={page.sections.service_benefits} locale="ar" />
      {isFlexibleForm(page.sections.join_application) ? (
        <section className="bg-background px-5 py-16 sm:px-8 sm:py-24" dir="rtl">
          <div className="mx-auto max-w-[900px] rounded-[2rem] border border-white/90 bg-white/35 p-6 shadow-xl sm:p-8">
            <FlexibleFormRenderer definition={page.sections.join_application} locale="ar" />
          </div>
        </section>
      ) : <JoinApplicationSection content={page.sections.join_application} locale="ar" />}
      <FaqSupportSection
        content={page.sections.faq_support}
        faqHref="/ar/faq"
        supportHref={footer.whatsappHref}
        locale="ar"
      />
    </main>
  );
}
