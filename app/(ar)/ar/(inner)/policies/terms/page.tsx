import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "شروط الاستخدام",
  description: "تعرف على شروط استخدام خدمات أنبوبة.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("ar", "terms");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function ArabicTermsPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("ar", "terms"), getPublishedLegalDocuments("ar")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="ar" />;
}
