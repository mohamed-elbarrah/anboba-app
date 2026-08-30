import type { Metadata } from "next";

import { ContactSection } from "@/components/public/sections/contact-section";
import { getDictionary } from "@/lib/dictionaries";

export const metadata: Metadata = {
  title: "Contact ANBOBA",
  description:
    "Contact the ANBOBA team for service questions, support, or partnership inquiries.",
};

export default async function EnglishContactPage() {
  const dictionary = await getDictionary("en");

  return <ContactSection content={dictionary.contact} locale="en" />;
}
