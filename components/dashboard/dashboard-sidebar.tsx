"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { FileText, LayoutDashboard, Mail, Images, Settings, Sparkles, Braces, UserCircle } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { locale, copy } = useDashboardLocale();
  const items = [
    { label: copy.overview, href: "/dashboard", icon: LayoutDashboard, disabled: false },
    { label: copy.pages, href: "/dashboard/pages", icon: FileText, disabled: false },
    { label: copy.forms, href: "/dashboard/forms", icon: Braces, disabled: false },
    { label: copy.media, href: null, icon: Images, disabled: true },
    { label: copy.messages, href: null, icon: Mail, disabled: true },
    { label: "Profile", href: "/dashboard/profile", icon: UserCircle, disabled: false },
    { label: copy.settings, href: null, icon: Settings, disabled: true },
  ] as const;
  return (
    <nav aria-label={`${copy.studio} navigation`}>
      <Sidebar side={locale === "ar" ? "right" : "left"} dir={locale === "ar" ? "rtl" : "ltr"} collapsible="icon" variant="inset">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
          <span className="group-data-[collapsible=icon]:hidden">ANBOBA <span className="text-muted-foreground">{copy.studio}</span></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{copy.workspace}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = !item.disabled && pathname === item.href || (!item.disabled && item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                return <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton className="h-11 text-base" isActive={active} disabled={item.disabled} aria-disabled={item.disabled} tooltip={item.disabled ? `${item.label} — coming soon` : item.label} render={item.disabled ? undefined : <Link href={item.href} />}>
                    <item.icon /><span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      </Sidebar>
    </nav>
  );
}
