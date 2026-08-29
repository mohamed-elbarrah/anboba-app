import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";

export type NavigationItem = {
  key: "home" | "about" | "contact" | "joinUs";
  label: string;
  href: string;
};

export type LocaleNavigation = {
  items: NavigationItem[];
  cta: { label: string; href: string };
};

/** Keep route matching consistent between desktop and mobile navigation. */
export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const normalizedHref = item.href.replace(/\/$/, "") || "/";

  return item.key === "home"
    ? normalizedPathname === normalizedHref
    : normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
}

export function getLocalizedPathname(pathname: string, locale: Locale, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments[1] === locale) segments[1] = nextLocale;
  else segments.splice(1, 0, nextLocale);
  return segments.join("/") || `/${nextLocale}`;
}

export function getNavigation(locale: Locale, dictionary: Dictionary): LocaleNavigation {
  return {
    items: [
      { key: "home", label: dictionary.pages.home, href: `/${locale}` },
      { key: "about", label: dictionary.pages.about, href: `/${locale}/about` },
      { key: "contact", label: dictionary.pages.contact, href: `/${locale}/contact` },
      { key: "joinUs", label: dictionary.pages.joinUs, href: `/${locale}/join-us` },
    ],
    cta: {
      label: dictionary.pages.downloadApp,
      href: `/${locale}#download-app`,
    },
  };
}
