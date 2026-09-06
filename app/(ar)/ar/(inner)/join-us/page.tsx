import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "join-us", { title: "ANBOBA" });
}

export default async function Page() {
  const page = await getPublishedPublicPage("ar", "join-us");
  return <PartnerRegistrationSection content={page.sections.partner_registration} locale="ar" />;
}
