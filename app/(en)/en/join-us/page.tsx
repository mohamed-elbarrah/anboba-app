import type { Metadata } from "next";

import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Join ANBOBA",
  description:
    "Apply to join ANBOBA as a distributor and grow with a trusted home delivery service.",
};

export default async function EnglishJoinUsPage() {
  const dictionary = await getDictionary("en");

  return (
    <PartnerRegistrationSection
      content={dictionary.partnerRegistration}
      locale="en"
    />
  );
}
