import type { Metadata } from "next";

import { LegalPolicyOverview } from "@/components/public/legal-policy";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "السياسات القانونية",
  description: "الوثائق القانونية الخاصة بخدمات أنبوبة.",
};

export default async function ArabicPoliciesPage() {
  const dictionary = await getDictionary("ar");

  return <LegalPolicyOverview heroContent={dictionary.pageTitle} locale="ar" />;
}
