import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "Refund Policy",
  description: "Learn about refunds for services provided through the ANBOBA app.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("en", "refunds");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function EnglishRefundPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("en", "refunds"), getPublishedLegalDocuments("en")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="en" />;
}
