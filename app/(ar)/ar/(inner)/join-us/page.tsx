import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { FlexibleFormRenderer } from "@/components/public/flexible-form-renderer";
import { isFlexibleForm } from "@/features/forms/renderer-adapter";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "join-us", { title: "ANBOBA" });
}

export default async function Page() {
  const page = await getPublishedPublicPage("ar", "join-us");
  return isFlexibleForm(page.sections.partner_registration) ? <main dir="rtl" className="public-hero-surface px-5 py-20 sm:px-8"><div className="mx-auto max-w-[900px] rounded-[2rem] border border-white bg-white/35 p-6 shadow-xl sm:p-8"><FlexibleFormRenderer definition={page.sections.partner_registration} locale="ar" /></div></main> : <PartnerRegistrationSection content={page.sections.partner_registration} locale="ar" />;
}
