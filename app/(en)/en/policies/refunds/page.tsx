import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getEnglishLegalDocument } from "@/content/legal/policies";

const document = getEnglishLegalDocument("refunds");

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Learn about refunds for services provided through the ANBOBA app.",
};

export default function EnglishRefundPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} locale="en" />;
}
