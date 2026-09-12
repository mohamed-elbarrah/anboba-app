import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import {
  brandingRevisionMenus,
  brandingRevisionMenuItems,
  brandingFooterBlocks,
  brandingFooterColumns,
  brandingFooterLayouts,
  brandingRevisionLocalizations,
  brandingRevisionPointers,
  brandingRevisions,
  media,
  settings,
  siteBranding,
} from "@/db/schema";
import type { Locale } from "@/lib/locales";
import { footerBlockSchema, footerColumnAllowsMenu, isSafeContactHref } from "./schema";
import {
  submissionNotificationRecipientSchema,
  submissionNotificationTemplateSchema,
  type SubmissionNotificationTemplates,
} from "./notification-schema";
import type { FooterLayout, NamedMenu, MenuItem } from "./types";

const localUploadPath = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

function isSafeMediaPath(value: string): boolean {
  return localUploadPath.test(value);
}

/** Validate values already persisted before exposing them to public rendering. */
function isSafePublicHref(value: string): boolean {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith("//"))
    return false;
  if (value.startsWith("/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const defaultSubmissionNotificationTemplates: SubmissionNotificationTemplates = {
  contact: {
    subject: "إرسال جديد عبر {{formName}}",
    body: "لديك إرسال جديد من {{senderName}} عبر {{formName}}.\nيمكنك الاطلاع على التفاصيل من لوحة التحكم.\n\nمعرّف الإرسال: {{submissionId}}\nوقت الإرسال: {{submittedAt}}",
  },
  join_application: {
    subject: "إرسال جديد عبر {{formName}}",
    body: "لديك إرسال جديد من {{senderName}} عبر {{formName}}.\nيمكنك الاطلاع على التفاصيل من لوحة التحكم.\n\nمعرّف الإرسال: {{submissionId}}\nوقت الإرسال: {{submittedAt}}",
  },
  partner_registration: {
    subject: "إرسال جديد عبر {{formName}}",
    body: "لديك إرسال جديد من {{senderName}} عبر {{formName}}.\nيمكنك الاطلاع على التفاصيل من لوحة التحكم.\n\nمعرّف الإرسال: {{submissionId}}\nوقت الإرسال: {{submittedAt}}",
  },
};

export async function getSubmissionNotificationTemplates(): Promise<SubmissionNotificationTemplates> {
  const rows = await getDb().select({ value: settings.valueJson }).from(settings)
    .where(eq(settings.key, "submission_notification_templates")).limit(1);
  if (!rows[0] || typeof rows[0].value !== "object" || rows[0].value === null || Array.isArray(rows[0].value)) return defaultSubmissionNotificationTemplates;
  const source = rows[0].value as Record<string, unknown>;
  const result = { ...defaultSubmissionNotificationTemplates };
  for (const formKey of ["contact", "join_application", "partner_registration"] as const) {
    const parsed = submissionNotificationTemplateSchema.safeParse(source[formKey]);
    if (parsed.success) result[formKey] = parsed.data;
    else if (source[formKey] !== undefined) console.error(`[settings:notification-templates] Invalid ${formKey} template; using default`);
  }
  return result;
}

export async function getSubmissionNotificationRecipient(): Promise<string | null> {
  const rows = await getDb()
    .select({ value: settings.valueJson })
    .from(settings)
    .where(eq(settings.key, "submission_notifications"))
    .limit(1);
  if (rows[0]) {
    const parsed = submissionNotificationRecipientSchema.safeParse(rows[0].value);
    if (parsed.success) return parsed.data.recipientEmail;
    console.error("[settings:notification-recipient] Invalid persisted recipient setting");
    return null;
  }
  const fallback = submissionNotificationRecipientSchema.safeParse({ recipientEmail: process.env.SUBMISSION_NOTIFICATION_TO ?? "" });
  return fallback.success ? fallback.data.recipientEmail : null;
}

export async function getSetting<T = unknown>(
  locale: Locale,
  key: string,
): Promise<T | null> {
  const rows = await getDb()
    .select({ value: settings.valueJson })
    .from(settings)
    .where(eq(settings.key, `${locale}:${key}`))
    .limit(1);
  return (rows[0]?.value ?? null) as T | null;
}

export type SiteSettingsItem = {
  itemKey: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  iconMediaId: string | null;
  parentId: string | null;
  sortOrder: number;
};

export type SiteSettingsDocument = {
  id: string;
  brandingKey: string;
  revisionToken: string;
  logoMediaId: string | null;
  faviconMediaId: string | null;
  locales: Record<Locale, { siteName: string; tagline: string | null; footerText: string | null }>;
  /** Canonical named menus. `navigation` remains a read compatibility projection. */
  menus: NamedMenu[];
  navigation: Record<Locale, { header: SiteSettingsItem[]; footer: SiteSettingsItem[] }>;
  footerLayouts: FooterLayout[];
};

export type SettingsEditorIdentity = Pick<SiteSettingsDocument, "id" | "brandingKey" | "revisionToken" | "logoMediaId" | "faviconMediaId" | "locales">;
export type SettingsEditorHeader = { revisionToken: string; menuKey: Record<Locale, string | null>; items: Record<Locale, SiteSettingsItem[]> };
export type SettingsEditorMenus = { revisionToken: string; menus: NamedMenu[]; items: Record<Locale, { header: SiteSettingsItem[]; footer: SiteSettingsItem[] }> };
export type SettingsEditorFooter = { revisionToken: string; layouts: FooterLayout[] };

export type PublicBrandingNavigationItem = SiteSettingsItem;
export type PublicBranding = {
  revisionId: string;
  logoPath: string | null;
  siteName: string;
  tagline: string | null;
  footerText: string | null;
  headerNavigation: SiteSettingsItem[];
  footerNavigation: SiteSettingsItem[];
};

export type PublishedFavicon = {
  mediaId: string;
  revisionId: string;
  /** The storage key is the canonical filesystem identity for uploaded media. */
  storageKey: string;
  mimeType: string;
};

/** Read the favicon from the published branding revision only. */
export async function getPublishedFavicon(): Promise<PublishedFavicon | null> {
  const db = getDb();
  const branding = (
    await db
      .select({ id: siteBranding.id })
      .from(siteBranding)
      .where(eq(siteBranding.brandingKey, "default"))
      .limit(1)
  )[0];
  if (!branding) return null;

  const pointer = (
    await db
      .select({ revisionId: brandingRevisionPointers.publishedRevisionId })
      .from(brandingRevisionPointers)
      .where(eq(brandingRevisionPointers.brandingId, branding.id))
      .limit(1)
  )[0];
  if (!pointer?.revisionId) return null;

  const revision = (
    await db
      .select({ id: brandingRevisions.id, faviconMediaId: brandingRevisions.faviconMediaId })
      .from(brandingRevisions)
      .where(
        and(
          eq(brandingRevisions.id, pointer.revisionId),
          eq(brandingRevisions.status, "published"),
        ),
      )
      .limit(1)
  )[0];
  if (!revision?.faviconMediaId) return null;

  const selected = (
    await db
      .select({ storageKey: media.storageKey, mimeType: media.mimeType })
      .from(media)
      .where(and(eq(media.id, revision.faviconMediaId), eq(media.kind, "image")))
      .limit(1)
  )[0];
  // The public URL is presentation data. Files must be resolved by the
  // canonical storage key, so a stale/malformed publicPath cannot influence
  // filesystem access in the icon route.
  if (!selected || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(selected.storageKey)) return null;

  return {
    mediaId: revision.faviconMediaId.toString(),
    revisionId: revision.id.toString(),
    storageKey: selected.storageKey,
    mimeType: selected.mimeType,
  };
}

async function readFooterLayouts(db: ReturnType<typeof getDb>, revisionId: bigint): Promise<FooterLayout[]> {
  const layouts = await db.select().from(brandingFooterLayouts).where(eq(brandingFooterLayouts.revisionId, revisionId));
  const result: FooterLayout[] = [];
  for (const layout of layouts) {
    const columns = await db.select().from(brandingFooterColumns).where(eq(brandingFooterColumns.layoutId, layout.id)).orderBy(asc(brandingFooterColumns.sortOrder));
    const blocks = await db.select().from(brandingFooterBlocks).where(eq(brandingFooterBlocks.layoutId, layout.id)).orderBy(asc(brandingFooterBlocks.sortOrder));
    result.push({ locale: layout.locale, columns: columns.map((column) => ({ columnKey: column.columnKey, sortOrder: column.sortOrder, heading: column.heading, assignedMenuKey: column.assignedMenuKey, blocks: blocks.filter((block) => block.columnId === column.id).flatMap((block) => {
      const content = jsonRecord(block.contentJson) ?? {};
      const parsed = { blockKey: block.blockKey, blockType: block.blockType, sortOrder: block.sortOrder, ...content };
      const validated = footerBlockSchema.safeParse(parsed);
      return validated.success ? [validated.data as FooterLayout["columns"][number]["blocks"][number]] : [];
    }) })) });
  }
  return result;
}

async function mediaPath(id: bigint | null): Promise<string | null> {
  if (!id) return null;
  const rows = await getDb()
    .select({ publicPath: media.publicPath })
    .from(media)
    .where(and(eq(media.id, id), eq(media.kind, "image")))
    .limit(1);
  const value = rows[0]?.publicPath;
  return value && isSafeMediaPath(value) ? value : null;
}

async function read(key: "draft" | "published"): Promise<SiteSettingsDocument | null> {
  const db = getDb();
  const branding = (
    await db
      .select()
      .from(siteBranding)
      .where(eq(siteBranding.brandingKey, "default"))
      .limit(1)
  )[0];
  if (!branding) return null;

  const pointer = (
    await db
      .select()
      .from(brandingRevisionPointers)
      .where(eq(brandingRevisionPointers.brandingId, branding.id))
      .limit(1)
  )[0];
  const revisionId = key === "draft" ? pointer?.draftRevisionId : pointer?.publishedRevisionId;
  if (!revisionId) return null;

  const revision = (
    await db
      .select()
      .from(brandingRevisions)
      .where(and(eq(brandingRevisions.id, revisionId), eq(brandingRevisions.status, key)))
      .limit(1)
  )[0];
  if (!revision) return null;

  const [localizations, menuRows, menuItemRows, footerLayouts] = await Promise.all([
    db.select().from(brandingRevisionLocalizations).where(eq(brandingRevisionLocalizations.revisionId, revision.id)),
    db.select().from(brandingRevisionMenus).where(eq(brandingRevisionMenus.revisionId, revision.id)),
    db.select().from(brandingRevisionMenuItems).where(eq(brandingRevisionMenuItems.revisionId, revision.id)).orderBy(asc(brandingRevisionMenuItems.sortOrder)),
    readFooterLayouts(db, revision.id),
  ]);
  const menus: NamedMenu[] = menuRows.map((menu) => ({
    menuKey: menu.menuKey, name: menu.name, locale: menu.locale, placement: menu.placement,
    assignmentKey: menu.assignmentKey,
    items: menuItemRows.filter((item) => item.menuId === menu.id).map((item): MenuItem => ({ itemKey: item.itemKey, parentKey: item.parentId ? (menuItemRows.find((parent) => parent.id === item.parentId)?.itemKey ?? null) : null, sortOrder: item.sortOrder, label: item.label, href: item.href, visible: item.visible, target: item.target })),
  }));
  const copy = (locale: Locale) => {
    const localization = localizations.find((item) => item.locale === locale);
    return {
      siteName: localization?.siteName ?? "",
      tagline: localization?.tagline ?? null,
      footerText: localization?.footerText ?? null,
    };
  };
  // Named menus are canonical. Legacy navigation rows are intentionally not
  // projected here: they may be stale CMS data after a named-menu migration.
  // Public adapters turn an absent/invalid projection into dictionary defaults.
  const canonicalMenus = menus;
  const projectedNavigation = (locale: Locale, placement: "header" | "footer") => {
    const assigned = canonicalMenus.filter((menu) => menu.locale === locale && menu.placement === placement && (placement !== "header" || menu.assignmentKey === "header-primary"));
    // A malformed revision must never select an arbitrary row. New writes reject
    // duplicates; invalid/unfinished canonical data is represented as empty.
    if (assigned.length !== 1) return [];
    return assigned[0].items
      .filter((item) => item.visible && isSafePublicHref(item.href))
      .map((item) => ({ itemKey: item.itemKey, label: item.label, href: item.href, openInNewTab: item.target === "_blank", iconMediaId: null, parentId: null, sortOrder: item.sortOrder }));
  };

  return {
    id: branding.id.toString(),
    brandingKey: branding.brandingKey,
    revisionToken: revision.id.toString(),
    logoMediaId: revision.logoMediaId?.toString() ?? null,
    faviconMediaId: revision.faviconMediaId?.toString() ?? null,
    locales: { ar: copy("ar"), en: copy("en") },
    menus: canonicalMenus,
    navigation: {
      ar: { header: projectedNavigation("ar", "header"), footer: projectedNavigation("ar", "footer") },
      en: { header: projectedNavigation("en", "header"), footer: projectedNavigation("en", "footer") },
    },
    footerLayouts,
  };
}

export const getSiteSettings = () => read("draft");

export async function getSettingsEditorIdentity(): Promise<SettingsEditorIdentity | null> {
  const settings = await getSiteSettings();
  if (!settings) return null;
  return { id: settings.id, brandingKey: settings.brandingKey, revisionToken: settings.revisionToken, logoMediaId: settings.logoMediaId, faviconMediaId: settings.faviconMediaId, locales: settings.locales };
}

export async function getSettingsEditorHeader(): Promise<SettingsEditorHeader | null> {
  const settings = await getSiteSettings();
  const assignedHeader = (locale: Locale) => {
    const matches = settings?.menus.filter((menu) => menu.locale === locale && menu.placement === "header" && menu.assignmentKey === "header-primary") ?? [];
    return matches.length === 1 ? matches[0].menuKey : null;
  };
  return settings ? { revisionToken: settings.revisionToken, menuKey: { ar: assignedHeader("ar"), en: assignedHeader("en") }, items: { ar: settings.navigation.ar.header, en: settings.navigation.en.header } } : null;
}

export async function getSettingsEditorMenus(): Promise<SettingsEditorMenus | null> {
  const settings = await getSiteSettings();
  return settings ? { revisionToken: settings.revisionToken, menus: settings.menus, items: settings.navigation } : null;
}

export async function getSettingsEditorFooter(): Promise<SettingsEditorFooter | null> {
  const settings = await getSiteSettings();
  return settings ? { revisionToken: settings.revisionToken, layouts: settings.footerLayouts } : null;
}

export type PublicFooterLink = {
  label: string;
  href: string;
  openInNewTab: boolean;
};

export type PublicFooterBlock =
  | { type: "link_group"; title: string | null; links: PublicFooterLink[] }
  | { type: "text"; title: string | null; text: string }
  | { type: "contact"; title: string | null; items: Array<{ kind: "phone" | "email" | "address"; label: string; value: string; href?: string }> }
  | { type: "social_links"; title: string | null; links: Array<{ platform: string; label: string; href: string }> };

export type PublicFooterColumn = {
  key: string;
  heading: string | null;
  blocks: PublicFooterBlock[];
};

export type PublicFooterLayout = {
  columns: PublicFooterColumn[];
};

function jsonRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function textValue(value: unknown, max = 1000): string | null {
  return typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
}

function safeFooterHref(value: unknown): string | null {
  const href = textValue(value, 500);
  return href && isSafePublicHref(href) ? href : null;
}

function safeFooterContactHref(kind: "phone" | "email" | "address", value: unknown): string | null {
  const href = textValue(value, 500);
  return href && isSafeContactHref(kind, href) ? href : null;
}

function parseFooterBlock(row: typeof brandingFooterBlocks.$inferSelect): PublicFooterBlock | null {
  const content = jsonRecord(row.contentJson);
  if (!content) return null;
  const title = textValue(content.title, 255);
  if (row.blockType === "text") {
    const text = textValue(content.text, 5000);
    return text ? { type: "text", title, text } : null;
  }
  if (row.blockType === "link_group") {
    const rawLinks = Array.isArray(content.links) ? content.links : [];
    const links = rawLinks.flatMap((raw) => {
      const item = jsonRecord(raw);
      const label = textValue(item?.label, 255);
      const href = safeFooterHref(item?.href);
      return label && href ? [{ label, href, openInNewTab: item?.openInNewTab === true }] : [];
    });
    return links.length ? { type: "link_group", title, links } : null;
  }
  if (row.blockType === "contact") {
    const rawItems = Array.isArray(content.items) ? content.items : [];
    const items = rawItems.flatMap((raw) => {
      const item = jsonRecord(raw);
      const kind = item?.kind;
      const label = textValue(item?.label, 255);
      const value = textValue(item?.value, 500);
      if (!label || !value || !["phone", "email", "address"].includes(String(kind))) return [];
      const contactKind = kind as "phone" | "email" | "address";
      const href = contactKind === "address" ? null : safeFooterContactHref(contactKind, item?.href);
      return [{ kind: contactKind, label, value, ...(href ? { href } : {}) }];
    });
    const kindCounts = new Map(items.map((item) => [item.kind, 0]));
    for (const item of items) kindCounts.set(item.kind, (kindCounts.get(item.kind) ?? 0) + 1);
    const complete = items.length === 3 && (["phone", "email", "address"] as const).every((kind) => kindCounts.get(kind) === 1);
    return complete ? { type: "contact", title, items } : null;
  }
  if (row.blockType !== "social_links") return null;
  const rawLinks = Array.isArray(content.links) ? content.links : [];
  const links = rawLinks.flatMap((raw) => {
    const item = jsonRecord(raw);
    const platform = textValue(item?.platform, 50);
    const label = textValue(item?.label, 255);
    const href = safeFooterHref(item?.href);
    return platform && label && href ? [{ platform, label, href }] : [];
  });
  return links.length ? { type: "social_links", title, links } : null;
}

/** Read only the published, revision-owned footer layout. Partial layouts are rejected atomically. */
// React cache is request-scoped. It deduplicates the header/footer reads without
// retaining published CMS data between requests (or after a publish).
export const getPublicFooterLayout = cache(async function getPublicFooterLayout(
  locale: Locale,
  revisionId: string,
): Promise<PublicFooterLayout | null> {
  let id: bigint;
  try {
    id = BigInt(revisionId);
  } catch {
    return null;
  }
  const db = getDb();
  const layout = (await db.select().from(brandingFooterLayouts).where(and(eq(brandingFooterLayouts.revisionId, id), eq(brandingFooterLayouts.locale, locale))).limit(1))[0];
  if (!layout) return null;
  const [sourceColumns, blocks, assignedMenus, assignedItems] = await Promise.all([
    db.select().from(brandingFooterColumns).where(and(eq(brandingFooterColumns.layoutId, layout.id), eq(brandingFooterColumns.revisionId, id), eq(brandingFooterColumns.locale, locale))).orderBy(asc(brandingFooterColumns.sortOrder)),
    db.select().from(brandingFooterBlocks).where(and(eq(brandingFooterBlocks.layoutId, layout.id), eq(brandingFooterBlocks.revisionId, id), eq(brandingFooterBlocks.locale, locale))).orderBy(asc(brandingFooterBlocks.sortOrder)),
    db.select().from(brandingRevisionMenus).where(and(eq(brandingRevisionMenus.revisionId, id), eq(brandingRevisionMenus.locale, locale))),
    db.select().from(brandingRevisionMenuItems).where(and(eq(brandingRevisionMenuItems.revisionId, id), eq(brandingRevisionMenuItems.locale, locale))).orderBy(asc(brandingRevisionMenuItems.sortOrder)),
  ]);
  const menuCandidates = (menuKey: string) => assignedMenus.filter((menu) => menu.menuKey === menuKey && menu.locale === locale && menu.placement === "footer");
  const sourceBlocksFor = (columnId: bigint) => blocks.filter((block) => block.columnId === columnId);
  const hasInvalidMenuAssignment = sourceColumns.some((column) => {
    const assigned = Boolean(column.assignedMenuKey);
    return assigned && (!footerColumnAllowsMenu({ columnKey: column.columnKey, blocks: sourceBlocksFor(column.id) }) || menuCandidates(column.assignedMenuKey!).length !== 1);
  });
  const mapped = sourceColumns.map((column) => {
    const sourceBlocks = sourceBlocksFor(column.id);
    const menu = column.assignedMenuKey ? menuCandidates(column.assignedMenuKey)[0] : undefined;
    const menuItems = menu ? assignedItems.filter((item) => item.menuId === menu.id && item.locale === locale && item.visible && isSafePublicHref(item.href)) : [];
    const namedMenuBlock = menu && menuItems.length ? [{ type: "link_group" as const, title: null, links: menuItems.map((item) => ({ label: item.label, href: item.href, openInNewTab: item.target === "_blank" })) }] : [];
    const validBlocks = [...namedMenuBlock, ...sourceBlocks.flatMap((block) => {
      // A named menu owns link_group links; legacy copies are not rendered twice.
      if (column.assignedMenuKey && block.blockType === "link_group") return [];
      const parsedBlock = parseFooterBlock(block);
      return parsedBlock ? [parsedBlock] : [];
    })];
    return {
      key: column.columnKey,
      heading: textValue(column.heading, 255),
      blocks: validBlocks,
      complete: validBlocks.length > 0 && validBlocks.length === (sourceBlocks.filter((block) => !(column.assignedMenuKey && block.blockType === "link_group")).length + (menuItems.length ? 1 : 0)),
    };
  });
  // A published layout is one atomic document. Never expose a partial version:
  // falling back to the dictionary keeps the complete footer visible.
  const expectedBlockCount = blocks.filter((block) => {
    const column = sourceColumns.find((candidate) => candidate.id === block.columnId);
    return !(column?.assignedMenuKey && block.blockType === "link_group");
  }).length + mapped.filter((column) => column.blocks.some((block) => block.type === "link_group") && sourceColumns.find((candidate) => candidate.columnKey === column.key)?.assignedMenuKey).length;
  const renderedBlockCount = mapped.reduce((count, column) => count + column.blocks.length, 0);
  if (hasInvalidMenuAssignment || mapped.length === 0 || renderedBlockCount !== expectedBlockCount || !mapped.every((column) => column.complete)) return null;

  // The logo and description are rendered by SiteFooter's single brand column.
  // The seeded CMS document also stores that copy as a `brand` text column so
  // it can be edited with the rest of the layout; do not expose it as a second
  // generic column or the public footer will duplicate the brand section.
  const publicColumns = mapped
    .filter((column) => column.key !== "brand")
    .map(({ key, heading, blocks }) => ({ key, heading, blocks }));
  return publicColumns.length > 0 ? { columns: publicColumns } : null;
});

// Both the header and footer render in the same public request. Keep this
// request-level cache here, at the public CMS boundary, rather than caching DB
// results globally: published branding must be visible on the next request.
export const getPublicBranding = cache(async function getPublicBranding(locale: Locale): Promise<PublicBranding | null> {
  const db = getDb();
  const branding = (
    await db
      .select()
      .from(siteBranding)
      .where(eq(siteBranding.brandingKey, "default"))
      .limit(1)
  )[0];
  if (!branding) return null;

  const pointer = (
    await db
      .select()
      .from(brandingRevisionPointers)
      .where(eq(brandingRevisionPointers.brandingId, branding.id))
      .limit(1)
  )[0];
  if (!pointer?.publishedRevisionId) return null;

  const revision = (
    await db
      .select()
      .from(brandingRevisions)
      .where(
        and(
          eq(brandingRevisions.id, pointer.publishedRevisionId),
          eq(brandingRevisions.status, "published"),
        ),
      )
      .limit(1)
  )[0];
  if (!revision) return null;

  const localization = (
    await db
      .select()
      .from(brandingRevisionLocalizations)
      .where(
        and(
          eq(brandingRevisionLocalizations.revisionId, revision.id),
          eq(brandingRevisionLocalizations.locale, locale),
        ),
      )
      .limit(1)
  )[0];
  if (!localization) return null;

  const namedMenus = await db.select().from(brandingRevisionMenus).where(and(eq(brandingRevisionMenus.revisionId, revision.id), eq(brandingRevisionMenus.locale, locale)));
  const namedItems = await db.select().from(brandingRevisionMenuItems).where(and(eq(brandingRevisionMenuItems.revisionId, revision.id), eq(brandingRevisionMenuItems.locale, locale))).orderBy(asc(brandingRevisionMenuItems.sortOrder));
  const navigation = (placement: "header" | "footer") => {
    const assigned = namedMenus.filter((menu) => menu.locale === locale && menu.placement === placement && (placement !== "header" || menu.assignmentKey === "header-primary"));
    // Named menus are the sole CMS source for public navigation. Do not use
    // legacy rows when a canonical menu is absent, duplicated, or malformed;
    // the public adapter will supply dictionary-safe defaults instead.
    if (assigned.length !== 1) return [];
    return namedItems
      .filter((item) => item.menuId === assigned[0].id && item.locale === locale && item.visible && isSafePublicHref(item.href))
      .map((item) => ({ itemKey: item.itemKey, label: item.label, href: item.href, openInNewTab: item.target === "_blank", iconMediaId: null, parentId: null, sortOrder: item.sortOrder }));
  };

  return {
    revisionId: revision.id.toString(),
    logoPath: await mediaPath(revision.logoMediaId),
    siteName: localization.siteName,
    tagline: localization.tagline,
    footerText: localization.footerText,
    headerNavigation: navigation("header"),
    footerNavigation: navigation("footer"),
  };
});
