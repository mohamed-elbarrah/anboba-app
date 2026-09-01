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
  whatsappHref: string;
};

/** Build the WhatsApp destination from the phone number shown in the footer. */
export function getWhatsAppHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function getPublicFooterData(
  locale: Locale,
  dictionary: Dictionary,
): PublicFooterData {
  return {
    whatsappHref: getWhatsAppHref(dictionary.footer.phone),
    links: [
      { key: "about", label: dictionary.pages.about, href: `/${locale}/about` },
      {
        key: "terms",
        label: dictionary.footer.terms,
        href: `/${locale}/policies/terms`,
      },
      {
        key: "privacy",
        label: dictionary.footer.privacy,
        href: `/${locale}/policies/privacy`,
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
