"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavigationItemActive } from "@/lib/navigation";
import type { Locale } from "@/lib/locales";
import type { LocaleNavigation } from "@/lib/navigation";
import { SiteHeaderMobile } from "@/components/public/site-header-mobile";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import { PublicCtaLink } from "@/components/public/public-cta-link";

export function SiteHeaderNavigation({ locale, navigation }: { locale: Locale; navigation: LocaleNavigation }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"} className="hidden items-center gap-1 md:flex">
        {navigation.items.map((item) => {
          const active = isNavigationItemActive(pathname, item);
          return (
            <Link key={item.key} href={item.href} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab || /^https:\/\//i.test(item.href) ? "noopener noreferrer" : undefined} aria-current={active ? "page" : undefined} className={cn("rounded-full px-5 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", active && "bg-primary/10 font-semibold text-primary")}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <LanguageSwitcher locale={locale} pathname={pathname} />
        <PublicCtaLink href={navigation.cta.href}>{navigation.cta.label}</PublicCtaLink>
      </div>
      <div className="md:hidden"><SiteHeaderMobile navigation={navigation} locale={locale} pathname={pathname} /></div>
    </>
  );
}
