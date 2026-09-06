import "../globals.css";

/** Dashboard document shell. Workspace chrome is scoped to the workspace route group. */
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body>{children}</body></html>;
}
