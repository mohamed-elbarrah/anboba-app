import SiteFooter from "@/components/public/site-footer";
import SiteHeader from "@/components/public/site-header";

export default function ArabicInnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale="ar" />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter locale="ar" />
    </div>
  );
}
