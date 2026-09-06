import { ContactSection } from "@/components/public/sections/contact-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "contact", { title: "ANBOBA" });
}

export default async function Page() {
  const page = await getPublishedPublicPage("ar", "contact");
  return <ContactSection content={page.sections.contact} locale="ar" />;
}
