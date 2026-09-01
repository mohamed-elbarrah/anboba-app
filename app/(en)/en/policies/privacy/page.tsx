import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getEnglishLegalDocument } from "@/content/legal/policies";

const document = getEnglishLegalDocument("privacy");

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how ANBOBA protects your privacy and handles your data.",
};

export default function EnglishPrivacyPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} locale="en" />;
}
