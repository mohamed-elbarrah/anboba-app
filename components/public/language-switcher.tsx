"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLocalizedPathname,
} from "@/lib/navigation";
import type { Locale } from "@/lib/locales";

function LanguageFlag({ locale }: { locale: Locale }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full text-[15px] leading-none"
    >
      {locale === "ar" ? "🇸🇦" : "🇺🇸"}
    </span>
  );
}

export function LanguageSwitcher({
  locale,
  pathname,
}: {
  locale: Locale;
  pathname: string;
}) {
  const router = useRouter();

  function switchLocale(value: string | null) {
    if (value !== "ar" && value !== "en") return;
    router.push(getLocalizedPathname(pathname, locale, value));
  }

  return (
    <Select value={locale} onValueChange={switchLocale}>
      <SelectTrigger
        aria-label={locale === "ar" ? "اختيار اللغة" : "Select language"}
        className="h-10 min-w-[108px] rounded-full border border-border/60 bg-background/75 px-4 text-base font-medium text-muted-foreground shadow-sm hover:bg-background hover:text-primary"
      >
        <SelectValue>
          {(value) => (
            <span className="flex items-center gap-2">
              <LanguageFlag locale={value === "ar" ? "ar" : "en"} />
              {value === "ar" ? "عربي" : "English"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[132px]">
        <SelectItem value="ar">
          <span className="flex items-center gap-2">
            <LanguageFlag locale="ar" />
            عربي
          </span>
        </SelectItem>
        <SelectItem value="en">
          <span className="flex items-center gap-2">
            <LanguageFlag locale="en" />
            English
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
