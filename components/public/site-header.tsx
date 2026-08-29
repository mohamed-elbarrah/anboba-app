import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { getNavigation } from "@/lib/navigation";
import type { Locale } from "@/lib/locales";
import { SiteHeaderNavigation } from "@/components/public/site-header-navigation";

export default async function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = await getDictionary(locale);
  const navigation = getNavigation(locale, dictionary);

  return (
    <header className="px-4 pt-5 sm:px-6 sm:pt-7" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto flex min-h-16 max-w-[800px] items-center justify-between gap-4 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
        <Link href={`/${locale}`} aria-label={dictionary.pages.logoLabel} className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">
          <Image src="/brand/ANBOBA.png" alt={dictionary.pages.logoLabel} width={77} height={46} priority className="h-[38px] w-auto object-contain sm:h-[42px]" />
        </Link>
        <SiteHeaderNavigation locale={locale} navigation={navigation} />
      </div>
    </header>
  );
}

