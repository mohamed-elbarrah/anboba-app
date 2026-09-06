import type { Metadata } from "next";

import { LegalPolicyOverview } from "@/components/public/legal-policy";
import {
  getPublishedPageMetadata,
  getPublishedPublicPage,
} from "@/features/pages/public-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("ar", "policies", {
    title: "السياسات القانونية",
    description: "الوثائق القانونية الخاصة بخدمات أنبوبة.",
  });
}

export default async function ArabicPoliciesPage() {
  const page = await getPublishedPublicPage("ar", "policies");

  return <LegalPolicyOverview content={page.sections.policies} locale="ar" />;
}
