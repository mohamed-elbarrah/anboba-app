import type { Metadata } from "next";

import { ContactSection } from "@/components/public/sections/contact-section";
import { FlexibleFormRenderer } from "@/components/public/flexible-form-renderer";
import { isFlexibleForm } from "@/features/forms/renderer-adapter";
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

  return isFlexibleForm(page.sections.contact, "en") ? <main dir="ltr" className="bg-background px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-[900px] rounded-[2rem] border border-white/90 bg-white/35 p-6 shadow-xl sm:p-8"><FlexibleFormRenderer definition={page.sections.contact} locale="en" /></div></main> : <ContactSection content={page.sections.contact} locale="en" />;
}
