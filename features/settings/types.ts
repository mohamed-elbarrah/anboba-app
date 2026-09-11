import type { Locale } from "@/lib/locales";

export type BrandingPlacement = "header" | "footer";

export type BrandingLocalization = {
  locale: Locale;
  siteName: string;
  tagline: string | null;
  footerText: string | null;
};

export type MenuItem = {
  itemKey: string;
  parentKey: string | null;
  sortOrder: number;
  label: string;
  href: string;
  visible: boolean;
  target: "_self" | "_blank";
};

export type NamedMenu = {
  menuKey: string;
  name: string;
  locale: Locale;
  placement: BrandingPlacement;
  assignmentKey: string | null;
  items: MenuItem[];
};

export type BrandingNavigationItem = {
  itemKey: string;
  locale: Locale;
  placement: BrandingPlacement;
  parentKey: null;
  sortOrder: number;
  label: string;
  href: string;
  openInNewTab: boolean;
};

export type FooterLink = { label: string; href: string; openInNewTab: boolean };
export type FooterBlock =
  | { blockKey: string; blockType: "text"; sortOrder: number; title: string | null; text: string }
  | { blockKey: string; blockType: "link_group"; sortOrder: number; title: string | null; links: FooterLink[] }
  | { blockKey: string; blockType: "contact"; sortOrder: number; title: string | null; items: Array<{ kind: "phone" | "email" | "address"; label: string; value: string; href?: string }> }
  | { blockKey: string; blockType: "social_links"; sortOrder: number; title: string | null; links: Array<{ platform: string; label: string; href: string }> };
export type FooterColumn = { columnKey: string; sortOrder: number; heading: string | null; assignedMenuKey: string | null; blocks: FooterBlock[] };
export type FooterLayout = { locale: Locale; columns: FooterColumn[] };

export type SiteBrandingDocument = {
  id: string;
  brandingKey: string;
  revisionId: string;
  revisionToken: string;
  status: "draft" | "published";
  logoMediaId: string | null;
  faviconMediaId: string | null;
  localizations: BrandingLocalization[];
  navigation: BrandingNavigationItem[];
  updatedAt: string;
};

export type SiteBrandingPublic = Omit<SiteBrandingDocument, "revisionToken" | "status"> & {
  status: "published";
};
