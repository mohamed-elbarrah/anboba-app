import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getArabicLegalDocument } from "@/content/legal/policies";

const document = getArabicLegalDocument("privacy");

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "تعرف على سياسة الخصوصية الخاصة بخدمات أنبوبة.",
};

export default function ArabicPrivacyPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} locale="ar" />;
}
