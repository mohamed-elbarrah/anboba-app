import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = { title: "Dashboard | ANBOBA" };

/** Shared navigation chrome for dashboard workspace routes only. */
export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-svh"><SidebarProvider><DashboardSidebar /><SidebarInset className="bg-muted/30"><DashboardHeader />{children}</SidebarInset></SidebarProvider></div>;
}
