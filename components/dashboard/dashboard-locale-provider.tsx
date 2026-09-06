"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";

const preferenceCookie = "dashboard-locale";

type DashboardCopy = {
  overview: string;
  pages: string;
  forms: string;
  media: string;
  messages: string;
  settings: string;
  workspace: string;
  studio: string;
  comingSoon: string;
  contentWorkspace: string;
  language: string;
};

const copy: Record<Locale, DashboardCopy> = {
  en: {
    overview: "Overview", pages: "Pages", forms: "Forms", media: "Media", messages: "Messages", settings: "Settings",
    workspace: "Workspace", studio: "Studio", comingSoon: "Coming soon", contentWorkspace: "Content workspace", language: "Language",
  },
  ar: {
    overview: "نظرة عامة", pages: "الصفحات", forms: "النماذج", media: "الوسائط", messages: "الرسائل", settings: "الإعدادات",
    workspace: "مساحة العمل", studio: "استوديو", comingSoon: "قريباً", contentWorkspace: "مساحة المحتوى", language: "اللغة",
  },
};

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; copy: DashboardCopy };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function DashboardLocaleProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    copy: copy[locale],
    setLocale: (next: Locale) => {
      document.cookie = `${preferenceCookie}=${next}; Path=/dashboard; Max-Age=31536000; SameSite=Lax`;
      setLocaleState(next);
      // Server-rendered workspace content and the document shell must use the new preference too.
      router.refresh();
    },
  }), [locale, router]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useDashboardLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useDashboardLocale must be used inside DashboardLocaleProvider");
  return value;
}
