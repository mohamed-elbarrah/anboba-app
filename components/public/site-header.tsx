import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { getNavigation } from "@/lib/navigation";
import { getPublicBranding, type PublicBranding } from "@/features/settings/queries";
import type { Locale } from "@/lib/locales";
import { SiteHeaderNavigation } from "@/components/public/site-header-navigation";

export default async function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = await getDictionary(locale);
  let navigationBranding: Pick<PublicBranding, "headerNavigation"> | null = null;
  let branding: PublicBranding | null = null;
  try {
    branding = await getPublicBranding(locale);
    navigationBranding = branding;
  } catch (error) {
    // The public shell must remain available when the CMS is unavailable.
    console.error("[cms] Using static public branding fallback", error);
  }
  const navigation = getNavigation(locale, dictionary, navigationBranding);

  return (
    <header
      className="px-4 pt-5 sm:px-6 sm:pt-7"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center justify-between gap-4 rounded-full border border-border/80 bg-background/95 px-5 py-2.5 shadow-[0_12px_36px_color-mix(in_srgb,var(--foreground)_8%,transparent)] backdrop-blur sm:px-6">
        <Link
          href={`/${locale}`}
          aria-label={dictionary.pages.logoLabel}
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <Image
            src={branding?.logoPath ?? "/brand/ANBOBA.png"}
            alt={branding?.siteName ?? dictionary.pages.logoLabel}
            width={77}
            height={46}
            priority
            className="h-10 w-auto object-contain sm:h-12"
          />
        </Link>
        <SiteHeaderNavigation locale={locale} navigation={navigation} />
      </div>
    </header>
  );
}
