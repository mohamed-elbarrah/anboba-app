"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";
import { Button } from "@/components/ui/button";
import type { LocaleNavigation } from "@/lib/navigation";
import type { Locale } from "@/lib/locales";
import { cn } from "@/lib/utils";
import { isNavigationItemActive } from "@/lib/navigation";
import { LanguageSwitcher } from "@/components/public/language-switcher";

export function SiteHeaderMobile({
  navigation,
  locale,
  pathname,
}: {
  navigation: LocaleNavigation;
  locale: Locale;
  pathname: string;
}) {
  return (
    <Drawer.Root swipeDirection={locale === "ar" ? "right" : "left"}>
      <Drawer.Trigger
        render={<Button variant="ghost" size="icon" aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"} />}
        className="md:hidden"
      >
        <Menu aria-hidden="true" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch">
          <Drawer.Popup
            className={cn(
              "h-full w-[min(22rem,88vw)] overflow-y-auto overscroll-contain bg-white p-6 text-slate-950 shadow-2xl outline-none touch-pan-y [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-300 ease-out",
              locale === "ar"
                ? "ml-auto data-ending-style:translate-x-full data-starting-style:translate-x-full"
                : "mr-auto data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
            )}
          >
            <Drawer.Content className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <Drawer.Title className="text-lg font-semibold">ANBOBA</Drawer.Title>
                <Drawer.Close
                  render={<Button variant="ghost" size="icon" aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"} />}
                >
                  <X aria-hidden="true" />
                </Drawer.Close>
              </div>
              <Drawer.Description className="sr-only">
                {locale === "ar" ? "روابط الموقع الرئيسية" : "Main site navigation"}
              </Drawer.Description>
              <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"} className="mt-10 flex flex-col gap-2">
                {navigation.items.map((item) => {
                  const active = isNavigationItemActive(pathname, item);
                  return (
                  <Drawer.Close
                    key={item.key}
                    nativeButton={false}
                    render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
                    className={cn("rounded-xl px-4 py-3 text-base transition-colors hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500", active && "bg-orange-50 font-semibold text-orange-600")}
                  >
                    {item.label}
                  </Drawer.Close>
                  );
                })}
                <Drawer.Close
                  nativeButton={false}
                  render={<Link href={navigation.cta.href} />}
                  className="mt-4 rounded-full bg-orange-500 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                >
                  {navigation.cta.label}
                </Drawer.Close>
                <div className="mt-3 flex justify-start px-1">
                  <LanguageSwitcher locale={locale} pathname={pathname} />
                </div>
              </nav>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
