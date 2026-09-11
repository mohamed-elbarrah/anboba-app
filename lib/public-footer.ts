import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/locales";
import type { PublicBrandingNavigationItem, PublicFooterLayout } from "@/features/settings/queries";

export type FooterLink = {
  key: string;
  label: string;
  href: string;
  openInNewTab?: boolean;
};

export type FooterContact = {
  kind: "phone" | "email" | "address";
  label: string;
  value: string;
  href?: string;
};

export type PublicFooterData = {
  brandDescription: string;
  siteName: string;
  logoPath: string;
  links: FooterLink[];
  contacts: FooterContact[];
  whatsappHref: string;
  layout: PublicFooterLayout | null;
};

/** Build the WhatsApp destination from the phone number shown in the footer. */
export function getWhatsAppHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function getPublicFooterData(
  locale: Locale,
  dictionary: Dictionary,
  options?: {
    branding?: { siteName: string; logoPath: string | null; footerText: string | null; footerNavigation: PublicBrandingNavigationItem[] } | null;
    footerSettings?: Partial<Dictionary["footer"]> | null;
    layout?: PublicFooterLayout | null;
  },
): PublicFooterData {
  const footer = { ...dictionary.footer };
  for (const key of Object.keys(dictionary.footer) as (keyof Dictionary["footer"])[]) {
    const value = options?.footerSettings?.[key];
    if (typeof value === "string") footer[key] = value;
  }
  const branding = options?.branding;
  // Public menus are intentionally flat; legacy child rows render as roots.
  const cmsLinks = branding?.footerNavigation.filter((item) => item.href);
  return {
    brandDescription: branding?.footerText || footer.brandDescription,
    siteName: branding?.siteName || "ANBOBA",
    logoPath: branding?.logoPath || "/brand/ANBOBA.png",
    whatsappHref: getWhatsAppHref(footer.phone),
    links: [
      ...(cmsLinks?.length
        ? cmsLinks.map((item) => ({ key: item.itemKey, label: item.label, href: item.href, openInNewTab: item.openInNewTab }))
        : [
            { key: "about", label: dictionary.pages.about, href: `/${locale}/about` },
            { key: "terms", label: footer.terms, href: `/${locale}/policies/terms` },
            { key: "privacy", label: footer.privacy, href: `/${locale}/policies/privacy` },
            { key: "refunds", label: footer.refunds, href: `/${locale}/policies/refunds` },
          ]),
    ],
    contacts: [
      {
        kind: "phone",
        label: footer.phoneLabel,
        value: footer.phone,
        href: `tel:${footer.phone.replace(/\D/g, "")}`,
      },
      {
        kind: "email",
        label: footer.emailLabel,
        value: footer.email,
        href: `mailto:${footer.email}`,
      },
      {
        kind: "address",
        label: footer.addressLabel,
        value: footer.address,
      },
    ],
    layout: options?.layout ?? null,
  };
}
