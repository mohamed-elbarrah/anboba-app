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
  };
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
