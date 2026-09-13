import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Globe2, House, Mail, Phone } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";
import { getPublicFooterData, type FooterContact } from "@/lib/public-footer";
import { getPublicBranding, getPublicFooterLayout, getSetting, type PublicFooterBlock } from "@/features/settings/queries";
import { SiteFooterLanguageSwitcher } from "@/components/public/site-footer-language-switcher";

const contactIcons = {
  phone: Phone,
  email: Mail,
  address: House,
} as const;

function ContactItem({ contact }: { contact: FooterContact }) {
  const Icon = contactIcons[contact.kind];
  const content = (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
      <span className="sr-only">{contact.label}: </span>
      <span dir="auto" className="min-w-0 break-words [overflow-wrap:anywhere]">
        {contact.value}
      </span>
    </>
  );

  return contact.href ? (
    <Link
      href={contact.href}
      className="flex w-full min-w-0 items-center gap-3 rounded-md text-base text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {content}
    </Link>
  ) : (
    <span className="flex w-full min-w-0 items-center gap-3 text-base text-muted-foreground">
      {content}
    </span>
  );
}

function FooterBlock({ block }: { block: PublicFooterBlock }) {
  const heading = block.title ? <h3 className="mb-4 text-lg font-bold">{block.title}</h3> : null;
  if (block.type === "text") return <div>{heading}<p className="text-base leading-8 text-muted-foreground">{block.text}</p></div>;
  if (block.type === "link_group") return <div>{heading}<ul className="space-y-4">{block.links.map((link) => <li key={`${link.href}:${link.label}`}><Link href={link.href} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab || /^https:\/\//i.test(link.href) ? "noopener noreferrer" : undefined} className="rounded-md text-base text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{link.label}</Link></li>)}</ul></div>;
  if (block.type === "contact") return <div>{heading}<ul className="space-y-5">{block.items.map((item) => <li key={`${item.kind}:${item.value}`}><ContactItem contact={item} /></li>)}</ul></div>;
  return <div>{heading}<ul className="space-y-4">{block.links.map((link) => <li key={link.href}><Link href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-base text-muted-foreground hover:text-primary"><Globe2 aria-hidden="true" className="size-5 shrink-0 text-primary" />{link.label}<ExternalLink aria-hidden="true" className="size-3.5" /></Link></li>)}</ul></div>;
}

function FooterColumn({ column, fallbackLabel }: { column: { key: string; heading: string | null; blocks: PublicFooterBlock[] }; fallbackLabel: string }) {
  const heading = column.heading?.trim() || null;
  const headingId = `footer-column-${column.key}`;
  return (
    <section aria-labelledby={heading ? headingId : undefined} aria-label={heading ? undefined : fallbackLabel} className="min-w-0">
      {heading ? <h2 id={headingId} className="mb-5 text-lg font-bold">{heading}</h2> : null}
      <div className="space-y-6">{column.blocks.map((block, index) => <FooterBlock key={`${column.key}:${block.type}:${index}`} block={block} />)}</div>
    </section>
  );
}

export default async function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = await getDictionary(locale);
  let branding = null;
  let footerSettings = null;
  try {
    [branding, footerSettings] = await Promise.all([
      getPublicBranding(locale),
      getSetting<Partial<typeof dictionary.footer>>(locale, "footer"),
    ]);
  } catch (error) {
    // The public shell must remain available when the CMS is unavailable.
    console.error("[cms] Using static public footer fallback", error);
  }
  let layout = null;
  if (branding) {
    try {
      layout = await getPublicFooterLayout(locale, branding.revisionId);
    } catch (error) {
      console.error("[cms] Using static public footer layout fallback", error);
    }
  }
  // A missing or rejected published layout must not leave a half-rendered CMS
  // footer (including a partial CMS menu). Use the complete dictionary footer.
  const footerBranding = branding && !layout ? { ...branding, footerNavigation: [] } : branding;
  const footer = getPublicFooterData(locale, dictionary, { branding: footerBranding, footerSettings, layout });

  return (
    <footer
      className="mt-auto bg-muted px-5 pb-5 pt-12 text-foreground sm:px-8 sm:pt-16 lg:pt-20"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-[1440px]">
        <div
          className="grid gap-x-5 gap-y-10 sm:gap-8"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))" }}
        >
          <section
            aria-labelledby="footer-brand-heading"
            className="min-w-0 space-y-4"
          >
            <h2 id="footer-brand-heading" className="sr-only">
              {footer.siteName}
            </h2>
            <Image
              src={footer.logoPath}
              alt={footer.siteName || dictionary.pages.logoLabel}
              width={77}
              height={46}
              className="h-12 w-auto object-contain"
            />
            <p className="max-w-sm text-base leading-8 text-muted-foreground lg:text-lg">
              {footer.brandDescription}
            </p>
            <div
              dir="ltr"
              className="grid grid-cols-2 gap-2 lg:w-full lg:max-w-[360px]"
              aria-label={dictionary.pages.downloadApp}
            >
              {footer.appStores.map((store) => {
                const content = (
                  <>
                    <Image
                      src={store.iconPath}
                      alt=""
                      width={32}
                      height={33}
                      className="h-8 w-auto shrink-0 object-contain"
                    />
                    <span className="flex min-w-0 flex-col text-left leading-none text-foreground">
                      <span className="text-[10px] font-medium sm:text-xs">{dictionary.footer.downloadOn}</span>
                      <span className="mt-1 truncate text-sm font-semibold sm:text-base">{store.label}</span>
                    </span>
                  </>
                );
                const className = "flex min-h-[70px] min-w-0 cursor-pointer items-center justify-center gap-3 rounded-full border border-border bg-white px-3 text-center shadow-sm transition-colors hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:px-4";
                const isPlaceholder = store.href === "#";
                return (
                  <Link
                    key={store.name}
                    href={store.href}
                    target={isPlaceholder ? undefined : "_blank"}
                    rel={isPlaceholder ? undefined : "noopener noreferrer"}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          {footer.layout ? footer.layout.columns.map((column) => (
            <FooterColumn key={column.key} column={column} fallbackLabel={dictionary.footer.quickLinks} />
          )) : <>
            <nav aria-labelledby="footer-links-heading" className="min-w-0">
              <h2 id="footer-links-heading" className="mb-5 text-lg font-bold">{dictionary.footer.quickLinks}</h2>
              <ul className="space-y-4">
                {footer.links.map((link) => <li key={link.key}><Link href={link.href} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab || /^https:\/\//i.test(link.href) ? "noopener noreferrer" : undefined} className="rounded-md text-base text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{link.label}</Link></li>)}
              </ul>
            </nav>
            <section aria-labelledby="footer-contact-heading" className="min-w-0">
              <h2 id="footer-contact-heading" className="mb-5 text-lg font-bold">{dictionary.footer.contact}</h2>
              <ul className="space-y-5">{footer.contacts.map((contact) => <li key={contact.kind}><ContactItem contact={contact} /></li>)}</ul>
            </section>
          </>}
        </div>

        <div
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="mt-10 flex flex-row items-center justify-between gap-4 border-t border-border pt-5 text-sm text-muted-foreground"
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
