import { PartnerRegistrationSection } from "@/components/public/sections/partner-registration-section";
import { getDictionary } from "@/lib/dictionaries";

export default async function Page() {
  const dictionary = await getDictionary("ar");
  return <PartnerRegistrationSection content={dictionary.partnerRegistration} locale="ar" />;
}
