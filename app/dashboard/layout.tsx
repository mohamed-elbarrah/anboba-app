import "../globals.css";
import { cookies } from "next/headers";
import { DashboardLocaleProvider } from "@/components/dashboard/dashboard-locale-provider";
import { isLocale, type Locale } from "@/lib/locales";
import { pingARLT } from "@/lib/fonts";
import { requireAdmin } from "@/features/auth/session";

/** Dashboard document shell. The admin's language preference is kept in a scoped cookie. */
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  const storedLocale = (await cookies()).get("dashboard-locale")?.value;
  const locale: Locale = storedLocale && isLocale(storedLocale) ? storedLocale : "en";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={pingARLT.className}>
        <DashboardLocaleProvider initialLocale={locale}>{children}</DashboardLocaleProvider>
      </body>
    </html>
  );
}
