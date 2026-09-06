"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Mail, Images, Settings, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, disabled: false },
  { label: "Pages", href: "/dashboard/pages", icon: FileText, disabled: false },
  { label: "Media", href: null, icon: Images, disabled: true },
  { label: "Messages", href: null, icon: Mail, disabled: true },
  { label: "Settings", href: null, icon: Settings, disabled: true },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard navigation">
      <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
          <span className="group-data-[collapsible=icon]:hidden">ANBOBA <span className="text-muted-foreground">Studio</span></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = !item.disabled && pathname === item.href || (!item.disabled && item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                return <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton isActive={active} disabled={item.disabled} aria-disabled={item.disabled} tooltip={item.disabled ? `${item.label} — coming soon` : item.label} render={item.disabled ? undefined : <Link href={item.href} />}>
                    <item.icon /><span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="rounded-lg bg-sidebar-accent p-3 text-xs text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
          <p className="font-medium">CMS foundation</p><p className="mt-1 text-muted-foreground">Content workspace</p>
        </div>
      </SidebarFooter>
      </Sidebar>
    </nav>
  );
}
