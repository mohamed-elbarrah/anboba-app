import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "سياسة الاسترداد",
  description: "تعرف على سياسة الاسترداد الخاصة بخدمات أنبوبة.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("ar", "refunds");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function ArabicRefundPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("ar", "refunds"), getPublishedLegalDocuments("ar")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="ar" />;
}
