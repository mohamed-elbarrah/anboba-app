import type { Metadata } from "next";

import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { FlexibleFormRenderer } from "@/components/public/flexible-form-renderer";
import { isFlexibleForm } from "@/features/forms/renderer-adapter";
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

  return isFlexibleForm(page.sections.partner_registration, "en") ? <main dir="ltr" className="public-hero-surface px-5 py-20 sm:px-8"><div className="mx-auto max-w-[900px] rounded-[2rem] border border-white bg-white/35 p-6 shadow-xl sm:p-8"><FlexibleFormRenderer definition={page.sections.partner_registration} locale="en" /></div></main> : <PartnerRegistrationSection content={page.sections.partner_registration} locale="en" />;
}
