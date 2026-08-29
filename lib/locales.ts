export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];
export type LocaleDirection = "rtl" | "ltr";

export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleDirection(locale: Locale): LocaleDirection {
  return locale === "ar" ? "rtl" : "ltr";
}
