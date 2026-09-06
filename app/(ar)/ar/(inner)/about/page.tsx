import { AboutVisionMissionSection } from "@/components/public/sections/about-vision-mission-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "about", { title: "ANBOBA" });
}

export default async function ArabicAboutPage() {
  const page = await getPublishedPublicPage("ar", "about");

  return (
    <main>
      <WhyChooseUsSection
        content={page.sections.why_choose_us}
        variant="about"
        headingLevel="h1"
        locale="ar"
      />
      <AboutVisionMissionSection content={page.sections.vision_mission} locale="ar" />
    </main>
  );
}
