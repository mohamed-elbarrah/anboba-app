import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "تعرف على سياسة الخصوصية الخاصة بخدمات أنبوبة.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("ar", "privacy");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function ArabicPrivacyPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("ar", "privacy"), getPublishedLegalDocuments("ar")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="ar" />;
}
