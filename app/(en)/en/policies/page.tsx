import type { Metadata } from "next";

import { PageTitleSection } from "@/components/public/sections/page-title-section";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how ANBOBA protects your privacy and handles information shared while using our services.",
};

export default async function EnglishPoliciesPage() {
  const dictionary = await getDictionary("en");

  return <PageTitleSection content={dictionary.pageTitle} locale="en" />;
}
