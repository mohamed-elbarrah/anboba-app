import "server-only";

import { z } from "zod";

const idSchema = z.string().regex(/^[1-9]\d*$/);
const keySchema = z.string().trim().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/);
const hrefSchema = z.string().trim().min(1).max(500).refine((value) => {
  if (/[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith("//")) return false;
  if (value.startsWith("/")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}, "Links must be relative paths or HTTPS URLs");

/** Contact hrefs are tied to the contact kind; generic links remain relative/HTTPS only. */
export function isSafeContactHref(kind: "phone" | "email" | "address", value: string): boolean {
  if (!value || value.length > 500 || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith("//")) return false;
  if (kind === "phone" && /^tel:\+?[0-9().-]+$/i.test(value)) return true;
  if (kind === "email" && /^mailto:[^\s@]+@[^\s@]+$/i.test(value)) return true;
  return hrefSchema.safeParse(value).success;
}

function contactHrefFromValue(kind: "phone" | "email" | "address", value: string): string | undefined {
  if (kind === "phone") {
    const href = `tel:${value.replace(/\D/g, "")}`;
    return isSafeContactHref(kind, href) ? href : undefined;
  }
  if (kind === "email") {
    const href = `mailto:${value}`;
    return isSafeContactHref(kind, href) ? href : undefined;
  }
  return undefined;
}

export const brandingLocalizationSchema = z.object({
  locale: z.enum(["ar", "en"]), siteName: z.string().trim().min(1).max(255),
  tagline: z.string().trim().max(500).nullable(), footerText: z.string().trim().max(65535).nullable(),
}).strict();

export const brandingNavigationItemSchema = z.object({
  itemKey: keySchema, locale: z.enum(["ar", "en"]), placement: z.enum(["header", "footer"]),
  parentKey: z.null(), sortOrder: z.number().int().nonnegative().max(10_000),
  label: z.string().trim().min(1).max(255), href: hrefSchema, openInNewTab: z.boolean(),
}).strict();

const footerLinkSchema = z.object({ label: z.string().trim().min(1).max(255), href: hrefSchema, openInNewTab: z.boolean().default(false) }).strict();
const footerContactSchema = z.object({ kind: z.enum(["phone", "email", "address"]), label: z.string().trim().min(1).max(255), value: z.string().trim().min(1).max(500), href: z.string().trim().min(1).max(500).optional() }).strict().superRefine((item, ctx) => {
  if (item.href && !isSafeContactHref(item.kind, item.href)) ctx.addIssue({ code: "custom", path: ["href"], message: "Invalid contact link" });
});
const footerContactItemsSchema = z.array(footerContactSchema).length(3).superRefine((items, ctx) => {
  for (const kind of ["phone", "email", "address"] as const) {
    if (items.filter((item) => item.kind === kind).length !== 1) {
      ctx.addIssue({ code: "custom", message: `Contact blocks require exactly one ${kind} item` });
    }
  }
}).transform((items) => items.map((item) => {
  const generatedHref = contactHrefFromValue(item.kind, item.value);
  if (generatedHref) return { ...item, href: generatedHref };
  const withoutHref = { ...item };
  delete withoutHref.href;
  return withoutHref;
}));
export const footerBlockSchema = z.discriminatedUnion("blockType", [
  z.object({ blockKey: keySchema, blockType: z.literal("text"), sortOrder: z.number().int().nonnegative(), title: z.string().trim().max(255).nullable(), text: z.string().trim().min(1).max(5000) }).strict(),
  z.object({ blockKey: keySchema, blockType: z.literal("link_group"), sortOrder: z.number().int().nonnegative(), title: z.string().trim().max(255).nullable(), links: z.array(footerLinkSchema).max(100) }).strict(),
  z.object({ blockKey: keySchema, blockType: z.literal("contact"), sortOrder: z.number().int().nonnegative(), title: z.string().trim().max(255).nullable(), items: footerContactItemsSchema }).strict(),
  z.object({ blockKey: keySchema, blockType: z.literal("social_links"), sortOrder: z.number().int().nonnegative(), title: z.string().trim().max(255).nullable(), links: z.array(z.object({ platform: keySchema, label: z.string().trim().min(1).max(255), href: hrefSchema }).strict()).max(50) }).strict(),
]);
export const footerColumnSchema = z.object({ columnKey: keySchema, sortOrder: z.number().int().nonnegative(), heading: z.string().trim().max(255).nullable(), assignedMenuKey: keySchema.nullable().optional().default(null), blocks: z.array(footerBlockSchema).max(50) }).strict();
export const footerLayoutSchema = z.object({ locale: z.enum(["ar", "en"]), columns: z.array(footerColumnSchema).max(12) }).strict();

/** Menus are link sources, never content (especially contact) sources. */
export function footerColumnAllowsMenu(column: { columnKey: string; blocks: ReadonlyArray<{ blockType: string }> }) {
  return !column.blocks.some((block) => block.blockType === "contact") &&
    (column.columnKey === "quick-links" || column.blocks.some((block) => block.blockType === "link_group"));
}

export const menuItemSchema = z.object({
  itemKey: keySchema, parentKey: keySchema.nullable(), sortOrder: z.number().int().nonnegative().max(10_000),
  label: z.string().trim().min(1).max(255), href: hrefSchema, visible: z.boolean().default(true), target: z.enum(["_self", "_blank"]).default("_self"),
}).strict();
export const menuSchema = z.object({
  menuKey: keySchema, name: z.string().trim().min(1).max(255), locale: z.enum(["ar", "en"]),
  placement: z.enum(["header", "footer"]), assignmentKey: keySchema.nullable().default(null), items: z.array(menuItemSchema).max(500),
}).strict();

// Keep settings mutations bounded to a realistic admin request. These limits also
// protect the transaction from accidentally materializing an unbounded revision.
const MAX_MENUS = 100;
const MAX_MENU_ITEMS = 5_000;
const MAX_FOOTER_COLUMNS = 24;
const MAX_FOOTER_BLOCKS = 1_000;

const canonicalSiteBrandingInputSchema = z.object({
  id: idSchema.optional(), brandingKey: z.literal("default"), revisionToken: idSchema.optional(),
  logoMediaId: idSchema.nullable(), faviconMediaId: idSchema.nullable(),
  localizations: z.array(brandingLocalizationSchema).length(2),
  menus: z.array(menuSchema).max(500).default([]),
  navigation: z.array(brandingNavigationItemSchema).max(500).default([]),
  footerLayouts: z.array(footerLayoutSchema).max(2).default([]),
}).strict().superRefine((value, ctx) => {
  const menuItems = value.menus.reduce((total, menu) => total + menu.items.length, 0);
  const footerColumns = value.footerLayouts.reduce((total, layout) => total + layout.columns.length, 0);
  const footerBlocks = value.footerLayouts.reduce((total, layout) => total + layout.columns.reduce((columns, column) => columns + column.blocks.length, 0), 0);
  if (value.menus.length > MAX_MENUS) ctx.addIssue({ code: "custom", path: ["menus"], message: "Too many menus" });
  if (menuItems > MAX_MENU_ITEMS) ctx.addIssue({ code: "custom", path: ["menus"], message: "Too many menu items" });
  if (footerColumns > MAX_FOOTER_COLUMNS) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Too many footer columns" });
  if (footerBlocks > MAX_FOOTER_BLOCKS) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Too many footer blocks" });
  if (new Set(value.localizations.map((x) => x.locale)).size !== 2) ctx.addIssue({ code: "custom", path: ["localizations"], message: "Both locales are required" });
  if (new Set(value.footerLayouts.map((x) => x.locale)).size !== value.footerLayouts.length) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Footer locales must be unique" });
  const menuKeys = new Set<string>();
  const headerPrimaryByLocale = new Map<string, number>();
  for (const menu of value.menus) {
    const menuId = `${menu.locale}:${menu.menuKey}`;
    if (menuKeys.has(menuId)) ctx.addIssue({ code: "custom", path: ["menus"], message: "Menu keys must be unique" });
    menuKeys.add(menuId);
    if (menu.assignmentKey === "header-primary") {
      if (menu.placement !== "header") ctx.addIssue({ code: "custom", path: ["menus"], message: "The header-primary assignment must use a header menu" });
      const count = (headerPrimaryByLocale.get(menu.locale) ?? 0) + 1;
      headerPrimaryByLocale.set(menu.locale, count);
      if (count > 1) ctx.addIssue({ code: "custom", path: ["menus"], message: "Only one header-primary menu may be assigned per locale" });
    }
    const itemKeys = new Set<string>();
    for (const item of menu.items) { if (itemKeys.has(item.itemKey)) ctx.addIssue({ code: "custom", path: ["menus"], message: "Menu item keys must be unique" }); itemKeys.add(item.itemKey); }
    for (const item of menu.items) if (item.parentKey && !itemKeys.has(item.parentKey)) ctx.addIssue({ code: "custom", path: ["menus"], message: "Menu parent does not exist" });
  }
  const seen = new Set<string>();
  for (const item of value.navigation) { const key = `${item.locale}:${item.placement}:${item.itemKey}`; if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["navigation"], message: "Navigation keys must be unique" }); seen.add(key); }
  for (const layout of value.footerLayouts) {
    const footerMenus = new Set(value.menus.filter((menu) => menu.locale === layout.locale && menu.placement === "footer").map((menu) => menu.menuKey));
    const columns = new Set<string>(); for (const column of layout.columns) { if (columns.has(column.columnKey)) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Footer column keys must be unique" }); columns.add(column.columnKey); if (column.assignedMenuKey && !footerColumnAllowsMenu(column)) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Menus may only be assigned to link-group or quick-links columns" }); if (column.assignedMenuKey && !footerMenus.has(column.assignedMenuKey)) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Assigned footer menus must match the layout locale and footer placement" }); const blocks = new Set<string>(); for (const block of column.blocks) { if (blocks.has(block.blockKey)) ctx.addIssue({ code: "custom", path: ["footerLayouts"], message: "Footer block keys must be unique" }); blocks.add(block.blockKey); } }
  }
});

export const siteBrandingInputSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const value = raw as Record<string, unknown>;
  const locales = value.localizations;
  const navigation = value.navigation;
  const normalizedLocales = locales && !Array.isArray(locales) ? Object.entries(locales as Record<string, object>).map(([locale, item]) => ({ locale, ...item })) : locales;
  const normalizeItem = (item: Record<string, unknown>, locale: string, placement: string, index: number) => { const rest = { ...item }; delete rest.parentId; delete rest.iconMediaId; return { ...rest, locale, placement, parentKey: null, sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index, openInNewTab: item.openInNewTab === true }; };
  const normalizedNavigation = Array.isArray(navigation)
    ? navigation.map((item) => { const raw = item as Record<string, unknown>; return normalizeItem(raw, String(raw.locale), String(raw.placement), typeof raw.sortOrder === "number" ? raw.sortOrder : 0); })
    : navigation && typeof navigation === "object" ? Object.entries(navigation as Record<string, Record<string, unknown>>).flatMap(([locale, placements]) => Object.entries(placements ?? {}).flatMap(([placement, items]) => Array.isArray(items) ? items.map((item, index) => normalizeItem(item as Record<string, unknown>, locale, placement, index)) : [])) : navigation;
  const legacyMenus = Array.isArray(normalizedNavigation) ? Object.values(
    normalizedNavigation.reduce((groups, item) => {
      const raw = item as Record<string, unknown>;
      const menuKey = String(raw.placement) === "header" ? "header-primary" : "footer-quick-links";
      const key = `${String(raw.locale)}:${menuKey}`;
      const group = groups[key] ?? { menuKey, name: menuKey, locale: String(raw.locale), placement: String(raw.placement), assignmentKey: String(raw.placement) === "header" ? "header-primary" : "quick-links", items: [] as Record<string, unknown>[] };
      group.items.push({ itemKey: raw.itemKey, parentKey: null, sortOrder: raw.sortOrder, label: raw.label, href: raw.href, visible: true, target: raw.openInNewTab === true ? "_blank" : "_self" }); groups[key] = group; return groups;
    }, {} as Record<string, { menuKey: string; name: string; locale: string; placement: string; assignmentKey: string; items: Record<string, unknown>[] }>),
  ) : [];
  return { ...value, localizations: normalizedLocales, navigation: normalizedNavigation, menus: value.menus ?? legacyMenus, footerLayouts: value.footerLayouts ?? [] };
}, canonicalSiteBrandingInputSchema);
export type SiteBrandingInput = z.input<typeof siteBrandingInputSchema>;
export type ParsedSiteBrandingInput = z.infer<typeof siteBrandingInputSchema>;
export type FooterLayoutInput = z.infer<typeof footerLayoutSchema>;
