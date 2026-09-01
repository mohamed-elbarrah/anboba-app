import type { Metadata } from "next";

import { LegalPolicyOverview } from "@/components/public/legal-policy";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Legal policies",
  description: "Read ANBOBA's Privacy Policy, Terms of Use, and Refund Policy.",
};

export default async function EnglishPoliciesPage() {
  const dictionary = await getDictionary("en");

  return <LegalPolicyOverview heroContent={dictionary.pageTitle} locale="en" />;
}
