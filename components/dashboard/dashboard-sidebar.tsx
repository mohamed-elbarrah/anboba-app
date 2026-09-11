"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardLocale } from "@/components/dashboard/dashboard-locale-provider";
import { FileText, LayoutDashboard, Mail, Images, Settings, Sparkles, Braces, UserCircle, PanelTop, List, PanelBottom } from "lucide-react";
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
    { label: "Policies", href: "/dashboard/policies", icon: FileText },
    { label: copy.messages, href: "/dashboard/messages", icon: Mail },
    { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
  ] as const;
  const appearanceItems = [
    { label: copy.siteIdentity, href: "/dashboard/appearance/site-identity", icon: Settings },
    { label: copy.header, href: "/dashboard/appearance/header", icon: PanelTop },
    { label: copy.menus, href: "/dashboard/appearance/menus", icon: List },
    { label: copy.footer, href: "/dashboard/appearance/footer", icon: PanelBottom },
  ] as const;
  const renderItems = (items: ReadonlyArray<{ label: string; href: string; icon: typeof Settings }>) => items.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <SidebarMenuItem key={item.href}>
      <SidebarMenuButton className="h-11 text-base" isActive={active} tooltip={{ children: item.label, side: locale === "ar" ? "left" : "right" }} render={<Link href={item.href} />}>
        <item.icon /><span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>;
  });
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
          <SidebarGroupContent><SidebarMenu>{renderItems(workspaceItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{copy.appearance}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(appearanceItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      </Sidebar>
    </nav>
  );
}
