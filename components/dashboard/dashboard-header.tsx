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
  ["/dashboard/appearance/site-identity", "siteIdentity"],
  ["/dashboard/appearance/header", "header"],
  ["/dashboard/appearance/menus", "menus"],
  ["/dashboard/appearance/footer", "footer"],
  ["/dashboard/appearance", "appearance"],
  ["/dashboard/profile", "profile"],
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { locale, setLocale, copy } = useDashboardLocale();
  const currentKey = sectionTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1];
  const current = currentKey === "pages" ? copy.pages : currentKey === "forms" ? copy.forms : currentKey === "media" ? copy.media : currentKey === "messages" ? copy.messages : currentKey === "siteIdentity" ? copy.siteIdentity : currentKey === "header" ? copy.header : currentKey === "menus" ? copy.menus : currentKey === "footer" ? copy.footer : currentKey === "appearance" ? copy.appearance : currentKey === "profile" ? "Profile" : copy.overview;

  return <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
    <SidebarTrigger aria-label="Toggle dashboard navigation" />
    <Separator orientation="vertical" className="h-5" />
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    <div className="ms-auto flex items-center gap-1 rounded-lg border bg-background p-1" aria-label={copy.language}>
      {(["ar", "en"] as Locale[]).map((value) => <button key={value} type="button" onClick={() => setLocale(value)} aria-pressed={locale === value} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${locale === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{value === "ar" ? "العربية" : "English"}</button>)}
    </div>
  </header>;
}
