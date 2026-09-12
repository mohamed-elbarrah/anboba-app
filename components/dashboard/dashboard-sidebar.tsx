"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { Bell, FileText, LayoutDashboard, Mail, Images, Settings, Sparkles, Braces, UserCircle, PanelTop, List, PanelBottom } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { locale, copy } = useDashboardLocale();
  const workspaceItems = [
    { label: copy.overview, href: "/dashboard", icon: LayoutDashboard },
    { label: copy.pages, href: "/dashboard/pages", icon: FileText },
    { label: copy.forms, href: "/dashboard/forms", icon: Braces },
    { label: copy.media, href: "/dashboard/media", icon: Images },
    { label: copy.policies, href: "/dashboard/policies", icon: FileText },
    { label: copy.messages, href: "/dashboard/messages", icon: Mail },
    { label: copy.profile, href: "/dashboard/profile", icon: UserCircle },
    { label: copy.notificationSettings, href: "/dashboard/settings/notifications", icon: Bell },
  ] as const;
  const appearanceItems = [
    { label: copy.siteIdentity, href: "/dashboard/appearance/site-identity", icon: Settings },
    { label: copy.header, href: "/dashboard/appearance/header", icon: PanelTop },
    { label: copy.menus, href: "/dashboard/appearance/menus", icon: List },
    { label: copy.footer, href: "/dashboard/appearance/footer", icon: PanelBottom },
  ] as const;
  const renderItems = (items: ReadonlyArray<{ label: string; href: string; icon: typeof Settings }>) => items.map((item) => {
    const active = item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        className="relative h-11 text-[0.9375rem] font-medium data-active:bg-brand-navy data-active:text-white data-active:shadow-sm data-active:hover:bg-brand-navy/95 data-active:after:absolute data-active:after:inset-y-2 data-active:after:start-0 data-active:after:w-1 data-active:after:rounded-e-full data-active:after:bg-primary"
        isActive={active}
        tooltip={{ children: item.label, side: locale === "ar" ? "left" : "right" }}
        render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
      >
        <item.icon /><span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>;
  });
  return (
    <nav aria-label={`${copy.studio} navigation`}>
      <Sidebar side={locale === "ar" ? "right" : "left"} dir={locale === "ar" ? "rtl" : "ltr"} collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <Link href="/dashboard" aria-label={`ANBOBA ${copy.studio}`} title={`ANBOBA ${copy.studio}`} className="flex w-full items-center gap-2 font-semibold tracking-tight group-data-[collapsible=icon]:justify-center">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
          <span className="group-data-[collapsible=icon]:hidden">ANBOBA <span className="text-muted-foreground">{copy.studio}</span></span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-1 py-1">
        <SidebarGroup>
          <SidebarGroupLabel>{copy.workspace}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(workspaceItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="border-t border-sidebar-border/60 pt-3">
          <SidebarGroupLabel>{copy.appearance}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(appearanceItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      </Sidebar>
    </nav>
  );
}
