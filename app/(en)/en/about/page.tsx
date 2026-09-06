import type { Metadata } from "next";

import { AboutVisionMissionSection } from "@/components/public/sections/about-vision-mission-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("en", "about", {
    title: "About ANBOBA",
    description:
      "Learn about ANBOBA's vision for clear, reliable home gas delivery and installation services.",
  });
}

export default async function EnglishAboutPage() {
  const page = await getPublishedPublicPage("en", "about");

  return (
    <main>
      <WhyChooseUsSection
        content={page.sections.why_choose_us}
        variant="about"
        headingLevel="h1"
        locale="en"
      />
      <AboutVisionMissionSection
        content={page.sections.vision_mission}
        locale="en"
      />
    </main>
  );
}
