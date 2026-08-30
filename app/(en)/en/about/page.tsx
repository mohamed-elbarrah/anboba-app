import type { Metadata } from "next";

import { AboutVisionMissionSection } from "@/components/public/sections/about-vision-mission-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "About ANBOBA",
  description:
    "Learn about ANBOBA's vision for clear, reliable home gas delivery and installation services.",
};

export default async function EnglishAboutPage() {
  const dictionary = await getDictionary("en");

  return (
    <main>
      <WhyChooseUsSection
        content={dictionary.whyChooseUs}
        variant="about"
        headingLevel="h1"
        locale="en"
      />
      <AboutVisionMissionSection
        content={dictionary.aboutVisionMission}
        locale="en"
      />
    </main>
  );
}
