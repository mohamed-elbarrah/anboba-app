import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";

export type FooterLink = {
  key: "about" | "terms" | "privacy";
  label: string;
  href: string;
};

export type FooterContact = {
  kind: "phone" | "email" | "location";
  label: string;
  value: string;
  href?: string;
};

/**
 * App store assets and destinations are intentionally not configured yet.
 * Replace this boundary with supplied badge assets and verified URLs later.
 */
export type FooterAppStore = {
  name: "googlePlay" | "appStore";
  label: string;
  available: false;
};

export type PublicFooterData = {
  links: FooterLink[];
  contacts: FooterContact[];
  appStores: FooterAppStore[];
};

export function getPublicFooterData(
  locale: Locale,
  dictionary: Dictionary,
): PublicFooterData {
  return {
    links: [
      { key: "about", label: dictionary.pages.about, href: `/${locale}/about` },
      {
        key: "terms",
        label: dictionary.footer.terms,
        href: `/${locale}/policies`,
      },
      {
        key: "privacy",
        label: dictionary.footer.privacy,
        href: `/${locale}/policies`,
      },
    ],
    contacts: [
      {
        kind: "phone",
        label: dictionary.footer.phoneLabel,
        value: dictionary.footer.phone,
        href: "tel:+96644043044",
      },
      {
        kind: "email",
        label: dictionary.footer.emailLabel,
        value: dictionary.footer.email,
        href: `mailto:${dictionary.footer.email}`,
      },
      {
        kind: "location",
        label: dictionary.footer.locationLabel,
        value: dictionary.footer.location,
      },
    ],
    appStores: [
      {
        name: "googlePlay",
        label: dictionary.footer.googlePlay,
        available: false,
      },
      { name: "appStore", label: dictionary.footer.appStore, available: false },
    ],
  };
}
