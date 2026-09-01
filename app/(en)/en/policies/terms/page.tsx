import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getEnglishLegalDocument } from "@/content/legal/policies";

const document = getEnglishLegalDocument("terms");

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Read the terms governing use of the ANBOBA app and its services.",
};

export default function EnglishTermsPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} locale="en" />;
}
