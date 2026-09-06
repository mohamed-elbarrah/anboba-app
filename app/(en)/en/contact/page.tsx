import type { Metadata } from "next";

import { ContactSection } from "@/components/public/sections/contact-section";
import { getPublishedPageMetadata, getPublishedPublicPage } from "@/features/pages/public-content";

export async function generateMetadata(): Promise<Metadata> {
  return getPublishedPageMetadata("en", "contact", {
    title: "Contact ANBOBA",
    description:
      "Contact the ANBOBA team for service questions, support, or partnership inquiries.",
  });
}

export default async function EnglishContactPage() {
  const page = await getPublishedPublicPage("en", "contact");

  return <ContactSection content={page.sections.contact} locale="en" />;
}
