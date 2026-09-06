import type { Metadata } from "next";

import { LegalPolicyOverview } from "@/components/public/legal-policy";
import {
  getPublishedPageMetadata,
  getPublishedPublicPage,
} from "@/features/pages/public-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("en", "policies", {
    title: "Legal policies",
    description: "Read ANBOBA's Privacy Policy, Terms of Use, and Refund Policy.",
  });
}

export default async function EnglishPoliciesPage() {
  const page = await getPublishedPublicPage("en", "policies");

  return <LegalPolicyOverview content={page.sections.policies} locale="en" />;
}
