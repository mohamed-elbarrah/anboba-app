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
        className="h-10 rounded-full border-0 px-4 text-base font-medium text-muted-foreground shadow-none hover:bg-muted hover:text-primary"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-16">
        <SelectItem value="ar">ar</SelectItem>
        <SelectItem value="en">en</SelectItem>
      </SelectContent>
    </Select>
  );
}
