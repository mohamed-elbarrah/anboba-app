import { PageTitleSection } from "@/components/public/sections/page-title-section";
import { getDictionary } from "@/lib/dictionaries";

export default async function ArabicPoliciesPage() {
  const dictionary = await getDictionary("ar");

  return <PageTitleSection content={dictionary.pageTitle} locale="ar" />;
}
