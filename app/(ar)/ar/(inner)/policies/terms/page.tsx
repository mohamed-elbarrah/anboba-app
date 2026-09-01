import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getArabicLegalDocument } from "@/content/legal/policies";

const document = getArabicLegalDocument("terms");

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "تعرف على شروط استخدام خدمات أنبوبة.",
};

export default function ArabicTermsPolicyPage() {
  if (!document) return null;
  return <LegalPolicyDocument document={document} />;
}
