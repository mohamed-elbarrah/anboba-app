import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/locales";
import { notFound } from "next/navigation";

type PageKey = "home" | "about" | "contact" | "joinUs" | "policies" | "placeholder";

export async function LocalePlaceholder({ locale, page }: { locale: string; page: PageKey }) {
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    // The home placeholder reserves the approved future app-download destination.
    <main id={page === "home" ? "download-app" : undefined}>
      <h1>{dictionary.pages[page]}</h1>
    </main>
  );
}
