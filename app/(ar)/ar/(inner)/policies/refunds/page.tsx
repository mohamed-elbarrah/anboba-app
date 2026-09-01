import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getArabicLegalDocument } from "@/content/legal/policies";

const document = getArabicLegalDocument("refunds");

export const metadata: Metadata = {
  title: "سياسة الاسترداد",
  description: "تعرف على سياسة الاسترداد الخاصة بخدمات أنبوبة.",
};

export default function ArabicRefundPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} locale="ar" />;
}
