import type { Metadata } from "next";
import "../globals.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = { title: "Dashboard | ANBOBA" };

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr">
    <body>
      <div className="min-h-svh">
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="bg-muted/30">
            <DashboardHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </body>
  </html>;
}
