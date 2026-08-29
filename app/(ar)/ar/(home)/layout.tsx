import SiteFooter from "@/components/public/site-footer";
import SiteHeader from "@/components/public/site-header";

export default function ArabicHomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-10">
          <SiteHeader locale="ar" />
        </div>
        {children}
      </div>
      <SiteFooter locale="ar" />
    </div>
  );
}
