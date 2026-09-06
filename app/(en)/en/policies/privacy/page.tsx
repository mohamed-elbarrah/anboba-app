import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how ANBOBA protects your privacy and handles your data.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("en", "privacy");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function EnglishPrivacyPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("en", "privacy"), getPublishedLegalDocuments("en")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="en" />;
}
