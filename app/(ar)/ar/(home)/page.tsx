import { HeroSection } from "@/components/public/sections/hero-section";
import { getDictionary } from "@/lib/dictionaries";

export default async function ArabicHome() {
  const dictionary = await getDictionary("ar");

  return (
    <main>
      <HeroSection content={dictionary.hero} locale="ar" />
    </main>
  );
}
