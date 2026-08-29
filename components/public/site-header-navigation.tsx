"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavigationItemActive } from "@/lib/navigation";
import type { Locale } from "@/lib/locales";
import type { LocaleNavigation } from "@/lib/navigation";
import { SiteHeaderMobile } from "@/components/public/site-header-mobile";
import { LanguageSwitcher } from "@/components/public/language-switcher";

export function SiteHeaderNavigation({
  locale,
  navigation,
}: {
  locale: Locale;
  navigation: LocaleNavigation;
}) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"} className="hidden items-center gap-1 md:flex">
        {navigation.items.map((item) => {
          const active = isNavigationItemActive(pathname, item);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500", active && "bg-orange-50 font-semibold text-orange-600")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        <LanguageSwitcher locale={locale} pathname={pathname} />
        <Link href={navigation.cta.href} className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
          {navigation.cta.label}
        </Link>
      </div>
      <div className="md:hidden">
        <SiteHeaderMobile navigation={navigation} locale={locale} pathname={pathname} />
      </div>
    </>
  );
}
