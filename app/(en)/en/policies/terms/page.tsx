import type { Metadata } from "next";

import { LegalPolicyDocument } from "@/components/public/legal-policy";
import { getPublishedLegalDocument, getPublishedLegalDocuments } from "@/features/pages/public-content";

const fallbackMetadata: Metadata = {
  title: "Terms of Use",
  description: "Read the terms governing use of the ANBOBA app and its services.",
};

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedLegalDocument("en", "terms");
  return {
    title: document.title || fallbackMetadata.title,
    description: document.summary || fallbackMetadata.description,
  };
}

export default async function EnglishTermsPolicyPage() {
  const [document, documents] = await Promise.all([getPublishedLegalDocument("en", "terms"), getPublishedLegalDocuments("en")]);
  return <LegalPolicyDocument document={document} documents={documents} locale="en" />;
}
