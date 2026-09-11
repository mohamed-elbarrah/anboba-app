import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";

/**
 * Future contract: the download section will own this anchor on each locale home page.
 * Do not add this id to the hero or a placeholder before that section exists.
 */
export const DOWNLOAD_APP_ANCHOR_ID = "download-app";
export const DOWNLOAD_APP_TARGET = `#${DOWNLOAD_APP_ANCHOR_ID}`;

export function getDownloadAppHref(locale: Locale) {
  return `/${locale}${DOWNLOAD_APP_TARGET}`;
}

export type NavigationItem = {
  /** CMS item keys are extensible; the built-in keys retain active-link semantics. */
  key: string;
  label: string;
  href: string;
  openInNewTab?: boolean;
};

export type LocaleNavigation = {
  items: NavigationItem[];
  cta: { label: string; href: string };
};

/** Keep route matching consistent between desktop and mobile navigation. */
export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const normalizedHref = item.href.replace(/\/$/, "") || "/";
  const isHome = item.key === "home" || /^\/[^/]+\/?$/.test(normalizedHref);

  return isHome
    ? normalizedPathname === normalizedHref
    : normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
}

export function getLocalizedPathname(pathname: string, locale: Locale, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments[1] === locale) segments[1] = nextLocale;
  else segments.splice(1, 0, nextLocale);
  return segments.join("/") || `/${nextLocale}`;
}

export function getNavigation(locale: Locale, dictionary: Dictionary, branding?: { headerNavigation: CmsNavigationItem[] } | null): LocaleNavigation {
  const fallback: LocaleNavigation = {
    items: [
      { key: "home", label: dictionary.pages.home, href: `/${locale}` },
      { key: "about", label: dictionary.pages.about, href: `/${locale}/about` },
      { key: "contact", label: dictionary.pages.contact, href: `/${locale}/contact` },
      { key: "joinUs", label: dictionary.pages.joinUs, href: `/${locale}/join-us` },
    ],
    cta: {
      label: dictionary.pages.downloadApp,
      href: getDownloadAppHref(locale),
    },
  };

  if (!branding?.headerNavigation.length) return fallback;
  // Public menus are intentionally flat. Treat legacy child rows as roots so
  // an old parent relationship never hides a published link.
  const items = branding.headerNavigation.filter((item) => isSafeHref(item.href));
  if (!items.length) return fallback;
  const cta = items.find((item) => /^(cta|download[_-]?app)$/i.test(item.itemKey));
  return {
    items: items.filter((item) => item !== cta).map(toNavigationItem),
    cta: cta ? toNavigationItem(cta) : fallback.cta,
  };
}

function isSafeHref(href: string) {
  return !/[\u0000-\u0020\u007f\\]/.test(href) && !href.startsWith("//") && (href.startsWith("/") || /^https:\/\//.test(href));
}

type CmsNavigationItem = { itemKey: string; label: string; href: string; openInNewTab: boolean; parentId: string | null };

function toNavigationItem(item: CmsNavigationItem): NavigationItem {
  return { key: item.itemKey, label: item.label, href: item.href, openInNewTab: item.openInNewTab };
}
