"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import type { Locale } from "@/lib/locales";

const sectionTitles = [
  ["/dashboard/pages", "Pages"],
  ["/dashboard/forms", "Forms"],
  ["/dashboard/media", "Media"],
  ["/dashboard/messages", "Messages"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/profile", "Profile"],
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { locale, setLocale, copy } = useDashboardLocale();
  const currentKey = sectionTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[0];
  const current = currentKey === "/dashboard/pages" ? copy.pages : currentKey === "/dashboard/forms" ? copy.forms : currentKey === "/dashboard/media" ? copy.media : currentKey === "/dashboard/messages" ? copy.messages : currentKey === "/dashboard/settings" ? copy.settings : currentKey === "/dashboard/profile" ? "Profile" : copy.overview;

  return <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
    <SidebarTrigger aria-label="Toggle dashboard navigation" />
    <Separator orientation="vertical" className="h-5" />
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    <div className="ms-auto flex items-center gap-1 rounded-lg border bg-background p-1" aria-label={copy.language}>
      {(["ar", "en"] as Locale[]).map((value) => <button key={value} type="button" onClick={() => setLocale(value)} aria-pressed={locale === value} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${locale === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{value === "ar" ? "العربية" : "English"}</button>)}
    </div>
  </header>;
}
