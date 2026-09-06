"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

const sectionTitles = [
  ["/dashboard/pages", "Pages"],
  ["/dashboard/media", "Media"],
  ["/dashboard/messages", "Messages"],
  ["/dashboard/settings", "Settings"],
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const current = sectionTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? "Overview";

  return <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
    <SidebarTrigger aria-label="Toggle dashboard navigation" />
    <Separator orientation="vertical" className="h-5" />
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>{current}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
  </header>;
}
