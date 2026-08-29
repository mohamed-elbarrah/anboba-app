import type { Locale } from "@/lib/locales";

const dictionaries = {
  ar: () => import("@/dictionaries/ar.json").then((module) => module.default),
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = {
  pages: {
    home: string;
    about: string;
    contact: string;
    joinUs: string;
    policies: string;
    placeholder: string;
    logoLabel: string;
    downloadApp: string;
  };
  footer: {
    brandDescription: string;
    quickLinks: string;
    contact: string;
    terms: string;
    privacy: string;
    phoneLabel: string;
    phone: string;
    emailLabel: string;
    email: string;
    locationLabel: string;
    location: string;
    googlePlay: string;
    appStore: string;
    comingSoon: string;
    languageLabel: string;
    copyright: string;
  };
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
