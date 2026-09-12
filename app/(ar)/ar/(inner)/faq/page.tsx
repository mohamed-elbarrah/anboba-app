import { FaqPage } from "@/components/public/faq-page";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata() {
  return getPublishedPageMetadata("ar", "faq", { title: "الأسئلة الشائعة | أنبوبة" });
}

export default async function ArabicFaqPage() {
  const page = await getPublishedPublicPage("ar", "faq");
  return <FaqPage content={page.sections.faq} locale="ar" />;
}
