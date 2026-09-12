import { FaqPage } from "@/components/public/faq-page";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("en", "faq", { title: "FAQ | ANBOBA" });
}

export default async function EnglishFaqPage() {
  const page = await getPublishedPublicPage("en", "faq");
  return <FaqPage content={page.sections.faq} locale="en" />;
}
