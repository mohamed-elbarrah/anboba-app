"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import type { Locale } from "@/lib/locales";

const sectionTitles = [
  ["/dashboard/pages", "pages"],
  ["/dashboard/forms", "forms"],
  ["/dashboard/media", "media"],
  ["/dashboard/messages", "messages"],
  ["/dashboard/policies", "policies"],
  ["/dashboard/appearance/site-identity", "siteIdentity"],
  ["/dashboard/appearance/header", "header"],
  ["/dashboard/appearance/menus", "menus"],
  ["/dashboard/appearance/footer", "footer"],
  ["/dashboard/appearance", "appearance"],
  ["/dashboard/profile", "profile"],
  ["/dashboard/settings/notifications", "notificationSettings"],
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { locale, setLocale, copy } = useDashboardLocale();
  const currentKey = sectionTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1];
  const current = currentKey === "pages" ? copy.pages : currentKey === "forms" ? copy.forms : currentKey === "media" ? copy.media : currentKey === "messages" ? copy.messages : currentKey === "siteIdentity" ? copy.siteIdentity : currentKey === "header" ? copy.header : currentKey === "menus" ? copy.menus : currentKey === "footer" ? copy.footer : currentKey === "appearance" ? copy.appearance : currentKey === "profile" ? copy.profile : currentKey === "policies" ? copy.policies : currentKey === "notificationSettings" ? copy.notificationSettings : copy.overview;

  return <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/90 px-4 shadow-sm backdrop-blur-md md:px-6">
    <SidebarTrigger className="shrink-0" aria-label={locale === "ar" ? "فتح أو إغلاق قائمة لوحة التحكم" : "Toggle dashboard navigation"} />
    <Separator orientation="vertical" className="h-5" />
    <Breadcrumb className="min-w-0"><BreadcrumbList><BreadcrumbItem><BreadcrumbPage className="truncate text-sm font-semibold text-foreground md:text-base">{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    <div className="ms-auto flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background p-1 shadow-sm" aria-label={copy.language}>
      {(["ar", "en"] as Locale[]).map((value) => <button key={value} type="button" onClick={() => setLocale(value)} aria-pressed={locale === value} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${locale === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{value === "ar" ? "العربية" : "English"}</button>)}
    </div>
  </header>;
}
