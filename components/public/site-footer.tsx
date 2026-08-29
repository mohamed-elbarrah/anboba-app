import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";
import { getPublicFooterData, type FooterContact } from "@/lib/public-footer";
import { SiteFooterLanguageSwitcher } from "@/components/public/site-footer-language-switcher";

const contactIcons = {
  phone: Phone,
  email: Mail,
  location: MapPin,
} as const;

function ContactItem({ contact }: { contact: FooterContact }) {
  const Icon = contactIcons[contact.kind];
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
      <span className="sr-only">{contact.label}: </span>
      <span dir="auto" className="min-w-0 break-words [overflow-wrap:anywhere]">
        {contact.value}
      </span>
    </>
  );

  return contact.href ? (
    <Link
      href={contact.href}
      className="flex w-full min-w-0 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {content}
    </Link>
  ) : (
    <span className="flex w-full min-w-0 items-center gap-2 text-sm text-muted-foreground">
      {content}
    </span>
  );
}

export default async function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = await getDictionary(locale);
  const footer = getPublicFooterData(locale, dictionary);

  return (
    <footer
      className="mt-auto bg-muted px-5 py-10 text-foreground sm:px-8 sm:py-12"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1040px]">
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-[2fr_1fr_1fr] sm:gap-8">
          <section aria-labelledby="footer-brand-heading" className="col-span-2 min-w-0 space-y-4 sm:col-span-1">
            <h2 id="footer-brand-heading" className="sr-only">ANBOBA</h2>
            <Image
              src="/brand/ANBOBA.png"
              alt={dictionary.pages.logoLabel}
              width={77}
              height={46}
              className="h-12 w-auto object-contain"
            />
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">
              {dictionary.footer.brandDescription}
            </p>
            <div className="grid grid-cols-2 gap-2" aria-label={dictionary.pages.downloadApp}>
              {footer.appStores.map((store) => (
                <div
                  key={store.name}
                  aria-disabled="true"
                  title={dictionary.footer.comingSoon}
                  className="flex min-h-12 min-w-0 cursor-not-allowed items-center justify-center rounded-xl border border-border bg-background/70 px-3 text-center opacity-65"
                >
                  <span className="text-xs font-semibold leading-tight text-muted-foreground">
                    {store.label}
                    <span className="block text-[10px] font-normal text-muted-foreground/70">
                      {dictionary.footer.comingSoon}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <nav aria-labelledby="footer-links-heading" className="min-w-0">
            <h2 id="footer-links-heading" className="mb-4 text-base font-bold">
              {dictionary.footer.quickLinks}
            </h2>
            <ul className="space-y-3">
              {footer.links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-contact-heading" className="min-w-0">
            <h2 id="footer-contact-heading" className="mb-4 text-base font-bold">
              {dictionary.footer.contact}
            </h2>
            <ul className="space-y-4">
              {footer.contacts.map((contact) => (
                <li key={contact.kind}>
                  <ContactItem contact={contact} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div
          dir="ltr"
          className="mt-10 flex flex-col-reverse items-start gap-4 border-t border-border pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p dir={locale === "ar" ? "rtl" : "ltr"}>
            © 2026 {dictionary.footer.copyright}
          </p>
          <div dir="ltr" className="flex items-center gap-2">
            <span className="sr-only">{dictionary.footer.languageLabel}</span>
            <SiteFooterLanguageSwitcher locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
