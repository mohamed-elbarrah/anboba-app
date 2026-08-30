import { ContactSection } from "@/components/public/sections/contact-section";
import { getDictionary } from "@/lib/dictionaries";

export default async function Page() {
  const dictionary = await getDictionary("ar");
  return <ContactSection content={dictionary.contact} locale="ar" />;
}
