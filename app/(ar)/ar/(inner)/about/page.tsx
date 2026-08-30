import { AboutVisionMissionSection } from "@/components/public/sections/about-vision-mission-section";
import { WhyChooseUsSection } from "@/components/public/sections/why-choose-us-section";
import { getDictionary } from "@/lib/dictionaries";

export default async function ArabicAboutPage() {
  const dictionary = await getDictionary("ar");

  return (
    <main>
      <WhyChooseUsSection
        content={dictionary.whyChooseUs}
        variant="about"
        headingLevel="h1"
      />
      <AboutVisionMissionSection content={dictionary.aboutVisionMission} />
    </main>
  );
}
