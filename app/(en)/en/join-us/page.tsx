import type { Metadata } from "next";

import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("en", "join-us", {
    title: "Join ANBOBA",
    description:
      "Apply to join ANBOBA as a distributor and grow with a trusted home delivery service.",
  });
}

export default async function EnglishJoinUsPage() {
  const page = await getPublishedPublicPage("en", "join-us");

  return (
    <PartnerRegistrationSection
      content={page.sections.partner_registration}
      locale="en"
    />
  );
}
