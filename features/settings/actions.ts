"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, max } from "drizzle-orm";
import { getDb } from "@/db";
import { brandingFooterBlocks, brandingFooterColumns, brandingFooterLayouts, brandingNavigationItems, brandingRevisionLocalizations, brandingRevisionMenuItems, brandingRevisionMenus, brandingRevisionPointers, brandingRevisions, media, siteBranding } from "@/db/schema";
import { getCurrentAdmin } from "@/features/auth/session";
import { footerColumnAllowsMenu, siteBrandingInputSchema, type FooterLayoutInput, type ParsedSiteBrandingInput } from "./schema";
import { getSiteSettings, type SiteSettingsDocument } from "./queries";
import type { NamedMenu } from "./types";

export type SettingsActionResult =
  | { ok: true; revisionToken: string; status: "draft" | "published" }
  | { ok: false; code: "AUTH_REQUIRED" | "INVALID_INPUT" | "NOT_FOUND" | "STALE_REVISION" | "INVALID_MEDIA" | "INVALID_NAVIGATION" | "INTERNAL_ERROR"; message: string };

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
const auth = { ok: false, code: "AUTH_REQUIRED", message: "Authentication is required for settings mutations" } as const;
const invalid = { ok: false, code: "INVALID_INPUT", message: "Invalid site settings" } as const;
const notFound = { ok: false, code: "NOT_FOUND", message: "Site settings were not found" } as const;
const stale = { ok: false, code: "STALE_REVISION", message: "The settings draft is out of date" } as const;
const internal = { ok: false, code: "INTERNAL_ERROR", message: "Unable to complete the settings request" } as const;

function parse(input: unknown, operation: string) {
  const started = performance.now();
  const result = siteBrandingInputSchema.safeParse(input);
  console.info("[settings:timing]", { operation, phase: "validation", ms: Math.round(performance.now() - started), valid: result.success });
  return result.success ? result.data : null;
}

function logTotal(operation: string, started: number, transactionStarted: number) {
  const total = performance.now() - started;
  const transactionMs = Math.round(total - transactionStarted);
  console.info("[settings:timing]", { operation, phase: "transaction", ms: transactionMs });
  // Drizzle resolves the transaction promise after COMMIT; this phase is the
  // redacted commit-to-response envelope, not request content.
  console.info("[settings:timing]", { operation, phase: "commit-total", transactionMs, totalMs: Math.round(total) });
}

async function verifyMedia(tx: Tx, value: ParsedSiteBrandingInput) {
  const ids = [...new Set([
    value.logoMediaId, value.faviconMediaId,
  ].filter((id): id is string => id !== null))];
  if (!ids.length) return true;
  const rows = await tx.select({ id: media.id, kind: media.kind, publicPath: media.publicPath }).from(media).where(inArray(media.id, ids.map(BigInt)));
  return rows.length === ids.length && rows.every((row) =>
    row.kind === "image" && /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(row.publicPath),
  );
}

function validateMenus(value: ParsedSiteBrandingInput) {
  for (const locale of ["ar", "en"] as const) {
    if (value.menus.filter((menu) => menu.locale === locale && menu.assignmentKey === "header-primary").length > 1) return false;
  }
  for (const menu of value.menus) {
    if (menu.assignmentKey === "header-primary" && menu.placement !== "header") return false;
    const itemKeys = new Set(menu.items.map((item) => item.itemKey));
    for (const item of menu.items) {
      if (item.parentKey && !itemKeys.has(item.parentKey)) return false;
      const seen = new Set<string>(); let parent = item.parentKey;
      while (parent) { if (seen.has(parent)) return false; seen.add(parent); parent = menu.items.find((candidate) => candidate.itemKey === parent)?.parentKey ?? null; }
    }
  }
  for (const layout of value.footerLayouts) for (const column of layout.columns) {
    if (column.assignedMenuKey && !footerColumnAllowsMenu(column)) return false;
    if (column.assignedMenuKey && !value.menus.some((menu) => menu.locale === layout.locale && menu.placement === "footer" && menu.menuKey === column.assignedMenuKey)) return false;
  }
  return true;
}

function validateNavigation(value: ParsedSiteBrandingInput) {
  const byKey = new Set(value.navigation.map((item) => `${item.locale}:${item.placement}:${item.itemKey}`));
  for (const item of value.navigation) {
    if (item.parentKey && !byKey.has(`${item.locale}:${item.placement}:${item.parentKey}`)) return false;
  }
  // A parent graph is supplied by keys, so this also rejects cycles.
  for (const item of value.navigation) {
    const seen = new Set<string>(); let current = item;
    while (current.parentKey) {
      const key = `${current.locale}:${current.placement}:${current.parentKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      const parent = value.navigation.find((candidate) => candidate.locale === current.locale && candidate.placement === current.placement && candidate.itemKey === current.parentKey);
      if (!parent) return false;
      current = parent;
    }
  }
  return true;
}

async function nextNumber(tx: Tx, brandingId: bigint) {
  const row = await tx.select({ value: max(brandingRevisions.revisionNumber) }).from(brandingRevisions).where(eq(brandingRevisions.brandingId, brandingId));
  return Number(row[0]?.value ?? 0) + 1;
}

type InsertResult = { insertId: bigint | number };

/**
 * MySQL allocates auto-increment ids contiguously for one multi-row INSERT.
 * Keeping the returned first id local to this transaction lets child rows be
 * batched without weakening the composite ownership foreign keys.
 */
function firstInsertedId(result: InsertResult[]) { return BigInt(result[0].insertId); }
function idsForBatch(result: InsertResult[], count: number) {
  const first = firstInsertedId(result);
  return Array.from({ length: count }, (_, index) => first + BigInt(index));
}

async function insertRevision(tx: Tx, brandingId: bigint, value: ParsedSiteBrandingInput, adminId: bigint, status: "draft" | "published", revisionNumber: number) {
  const started = performance.now();
  const inserted = await tx.insert(brandingRevisions).values({ brandingId, revisionNumber, status, logoMediaId: value.logoMediaId ? BigInt(value.logoMediaId) : null, faviconMediaId: value.faviconMediaId ? BigInt(value.faviconMediaId) : null, createdBy: adminId });
  const revisionId = BigInt(inserted[0].insertId);
  const counts = { localizations: value.localizations.length, menus: value.menus.length, menuItems: value.menus.reduce((sum, menu) => sum + menu.items.length, 0), layouts: value.footerLayouts.length, columns: value.footerLayouts.reduce((sum, layout) => sum + layout.columns.length, 0), blocks: value.footerLayouts.reduce((sum, layout) => sum + layout.columns.reduce((columns, column) => columns + column.blocks.length, 0), 0) };
  const batchStarted = performance.now();
  if (value.localizations.length) await tx.insert(brandingRevisionLocalizations).values(value.localizations.map((localization) => ({ revisionId, locale: localization.locale, siteName: localization.siteName, tagline: localization.tagline, footerText: localization.footerText })));

  // Named menus are the canonical source. Legacy navigation is accepted by the
  // schema only as an input compatibility projection. Menus can be inserted as
  // one batch; their child ids are derived from that batch's contiguous range.
  const menuIds = new Map<string, bigint>();
  if (value.menus.length) {
    const menuRows = value.menus.map((menu) => ({ revisionId, locale: menu.locale, menuKey: menu.menuKey, name: menu.name, placement: menu.placement, assignmentKey: menu.assignmentKey }));
    const menuResult = await tx.insert(brandingRevisionMenus).values(menuRows);
    idsForBatch(menuResult as unknown as InsertResult[], menuRows.length).forEach((id, index) => menuIds.set(`${value.menus[index].locale}:${value.menus[index].menuKey}`, id));
  }

  // Parent FKs require topological levels. Each level is still one batch per
  // menu, rather than one round trip per item.
  for (const menu of value.menus) {
    const menuId = menuIds.get(`${menu.locale}:${menu.menuKey}`)!;
    const pending = [...menu.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const ids = new Map<string, bigint>();
    while (pending.length) {
      const ready = pending.filter((item) => !item.parentKey || ids.has(item.parentKey));
      if (!ready.length) throw new Error("INVALID_NAVIGATION");
      const readyKeys = new Set(ready.map((item) => item.itemKey));
      pending.splice(0, pending.length, ...pending.filter((item) => !readyKeys.has(item.itemKey)));
      const rows = ready.map((item) => ({ menuId, revisionId, locale: menu.locale, itemKey: item.itemKey, parentId: item.parentKey ? ids.get(item.parentKey)! : null, sortOrder: item.sortOrder, label: item.label, href: item.href, visible: item.visible, target: item.target }));
      const result = await tx.insert(brandingRevisionMenuItems).values(rows);
      idsForBatch(result as unknown as InsertResult[], rows.length).forEach((id, index) => ids.set(ready[index].itemKey, id));
    }
  }

  // Layouts, columns, and blocks are each inserted in dependency order and
  // batched across all locales. This preserves every FK while avoiding the old
  // layout -> column -> block round-trip cascade.
  const layoutRows = value.footerLayouts.map((layout) => ({ revisionId, locale: layout.locale }));
  const layoutIds = new Map<string, bigint>();
  if (layoutRows.length) {
    const result = await tx.insert(brandingFooterLayouts).values(layoutRows);
    idsForBatch(result as unknown as InsertResult[], layoutRows.length).forEach((id, index) => layoutIds.set(value.footerLayouts[index].locale, id));
  }
  const columnRows = value.footerLayouts.flatMap((layout) => layout.columns.map((column) => ({ layoutId: layoutIds.get(layout.locale)!, revisionId, locale: layout.locale, columnKey: column.columnKey, sortOrder: column.sortOrder, heading: column.heading, assignedMenuKey: column.assignedMenuKey ?? null })));
  const columnIds = new Map<string, bigint>();
  if (columnRows.length) {
    const result = await tx.insert(brandingFooterColumns).values(columnRows);
    idsForBatch(result as unknown as InsertResult[], columnRows.length).forEach((id, index) => columnIds.set(`${columnRows[index].locale}:${columnRows[index].columnKey}`, id));
  }
  const blockRows = value.footerLayouts.flatMap((layout) => layout.columns.flatMap((column) => column.blocks.map((block) => {
    const { blockKey, blockType, sortOrder, ...content } = block;
    return { columnId: columnIds.get(`${layout.locale}:${column.columnKey}`)!, layoutId: layoutIds.get(layout.locale)!, revisionId, locale: layout.locale, blockKey, blockType, sortOrder, contentJson: content };
  })));
  if (blockRows.length) await tx.insert(brandingFooterBlocks).values(blockRows);
  console.info("[settings:timing]", { phase: "insert-batches", ms: Math.round(performance.now() - batchStarted), ...counts, status });
  console.info("[settings:timing]", { phase: "revision", ms: Math.round(performance.now() - started), revision: status });
  return revisionId;
}

async function target(tx: Tx, value: ParsedSiteBrandingInput) {
  // Lock the stable branding row before reading the pointer. Every revision
  // number is allocated while this lock is held, so concurrent saves and
  // publishes cannot observe the same MAX(revision_number).
  const branding = value.id
    ? (await tx
        .select()
        .from(siteBranding)
        .where(and(eq(siteBranding.id, BigInt(value.id)), eq(siteBranding.brandingKey, "default")))
        .limit(1)
        .for("update"))[0]
    : (await tx
        .select()
        .from(siteBranding)
        .where(eq(siteBranding.brandingKey, "default"))
        .limit(1)
        .for("update"))[0];
  if (!branding) return null;
  const pointer = (await tx.select().from(brandingRevisionPointers).where(eq(brandingRevisionPointers.brandingId, branding.id)).limit(1).for("update"))[0];
  if (!pointer?.draftRevisionId || !value.revisionToken || pointer.draftRevisionId.toString() !== value.revisionToken) return "stale" as const;
  const draft = (await tx.select().from(brandingRevisions).where(and(eq(brandingRevisions.id, pointer.draftRevisionId), eq(brandingRevisions.brandingId, branding.id), eq(brandingRevisions.status, "draft"))).limit(1))[0];
  return draft ? { branding, pointer, draft } : null;
}

function revalidate() { for (const locale of ["ar", "en"]) revalidatePath(`/${locale}`, "layout"); }

export async function saveSiteBrandingDraft(input: unknown): Promise<SettingsActionResult> {
  const operation = "save-draft";
  const started = performance.now();
  const admin = await getCurrentAdmin(); if (!admin) return auth;
  const value = parse(input, operation); if (!value) return invalid;
  try {
    const transactionStarted = performance.now();
    const result = await getDb().transaction(async (tx) => {
      if (!(await verifyMedia(tx, value))) return { ok: false, code: "INVALID_MEDIA", message: "One or more selected media items are unavailable" } as const;
      if (!validateMenus(value) || !validateNavigation(value)) return { ok: false, code: "INVALID_NAVIGATION", message: "Menus contain an invalid key, assignment, or parent relationship" } as const;
      if (!value.id) {
        if ((await tx.select({ id: siteBranding.id }).from(siteBranding).where(eq(siteBranding.brandingKey, value.brandingKey)).limit(1)).length) return stale;
        await tx.insert(siteBranding).values({ brandingKey: value.brandingKey });
        const branding = (await tx.select().from(siteBranding).where(eq(siteBranding.brandingKey, value.brandingKey)).limit(1))[0];
        if (!branding) return notFound;
        const revision = await insertRevision(tx, branding.id, value, admin.id, "draft", 1);
        await tx.insert(brandingRevisionPointers).values({ brandingId: branding.id, draftRevisionId: revision, publishedRevisionId: null });
        return { ok: true, revisionToken: revision.toString(), status: "draft" } as const;
      }
      const found = await target(tx, value); if (found === "stale") return stale; if (!found) return notFound;
      await tx.update(brandingRevisions).set({ status: "archived" }).where(eq(brandingRevisions.id, found.draft.id));
      const revision = await insertRevision(tx, found.branding.id, value, admin.id, "draft", await nextNumber(tx, found.branding.id));
      await tx.update(brandingRevisionPointers).set({ draftRevisionId: revision }).where(eq(brandingRevisionPointers.brandingId, found.branding.id));
      return { ok: true, revisionToken: revision.toString(), status: "draft" } as const;
    });
    logTotal(operation, started, transactionStarted);
    if (result.ok) revalidate(); return result;
  } catch (error) { console.error("[settings:save-draft]", error); return internal; }
}

export async function publishSiteBranding(input: unknown): Promise<SettingsActionResult> {
  const operation = "publish";
  const started = performance.now();
  const admin = await getCurrentAdmin(); if (!admin) return auth;
  const value = parse(input, operation); if (!value?.id || !value.revisionToken) return invalid;
  try {
    const transactionStarted = performance.now();
    const result = await getDb().transaction(async (tx) => {
      if (!(await verifyMedia(tx, value))) return { ok: false, code: "INVALID_MEDIA", message: "One or more selected media items are unavailable" } as const;
      if (!validateMenus(value) || !validateNavigation(value)) return { ok: false, code: "INVALID_NAVIGATION", message: "Menus contain an invalid key, assignment, or parent relationship" } as const;
      const found = await target(tx, value); if (found === "stale") return stale; if (!found) return notFound;
      if (found.pointer.publishedRevisionId) await tx.update(brandingRevisions).set({ status: "archived" }).where(eq(brandingRevisions.id, found.pointer.publishedRevisionId));
      await tx.update(brandingRevisions).set({ status: "archived" }).where(eq(brandingRevisions.id, found.draft.id));
      const published = await insertRevision(tx, found.branding.id, value, admin.id, "published", await nextNumber(tx, found.branding.id));
      const draft = await insertRevision(tx, found.branding.id, value, admin.id, "draft", await nextNumber(tx, found.branding.id));
      await tx.update(brandingRevisionPointers).set({ publishedRevisionId: published, draftRevisionId: draft }).where(eq(brandingRevisionPointers.brandingId, found.branding.id));
      return { ok: true, revisionToken: draft.toString(), status: "published" } as const;
    });
    logTotal(operation, started, transactionStarted);
    if (result.ok) revalidate(); return result;
  } catch (error) { console.error("[settings:publish]", error); return internal; }
}

export async function discardSiteBrandingDraft(input: unknown, brandingKeyArg?: string, revisionTokenArg?: string): Promise<SettingsActionResult> {
  const admin = await getCurrentAdmin(); if (!admin) return auth;
  const parsedInput = typeof input === "string" ? { id: input, brandingKey: brandingKeyArg ?? "default", revisionToken: revisionTokenArg, logoMediaId: null, faviconMediaId: null, localizations: [{ locale: "ar", siteName: "placeholder", tagline: null, footerText: null }, { locale: "en", siteName: "placeholder", tagline: null, footerText: null }], navigation: [] } : input;
  const started = performance.now();
  const operation = "discard";
  const parsed = parse(parsedInput, operation);
  if (!parsed?.id || !parsed.revisionToken) return invalid;
  const id = parsed.id;
  const brandingKey = parsed.brandingKey;
  const revisionToken = parsed.revisionToken;
  try {
    const transactionStarted = performance.now();
    const result = await getDb().transaction(async (tx) => {
      const value = { id, brandingKey, revisionToken } as ParsedSiteBrandingInput;
      const found = await target(tx, value); if (found === "stale") return stale; if (!found?.pointer.publishedRevisionId) return notFound;
      const published = (await tx.select().from(brandingRevisions).where(and(eq(brandingRevisions.id, found.pointer.publishedRevisionId), eq(brandingRevisions.status, "published"))).limit(1))[0]; if (!published) return notFound;
      const localizations = await tx.select().from(brandingRevisionLocalizations).where(eq(brandingRevisionLocalizations.revisionId, published.id));
      const navigation = await tx.select().from(brandingNavigationItems).where(eq(brandingNavigationItems.revisionId, published.id)).orderBy(asc(brandingNavigationItems.sortOrder));
      const layouts = await tx.select().from(brandingFooterLayouts).where(eq(brandingFooterLayouts.revisionId, published.id));
      const savedMenus = await tx.select().from(brandingRevisionMenus).where(eq(brandingRevisionMenus.revisionId, published.id));
      const savedMenuItems = await tx.select().from(brandingRevisionMenuItems).where(eq(brandingRevisionMenuItems.revisionId, published.id));
      const menus = savedMenus.map((menu) => ({ menuKey: menu.menuKey, name: menu.name, locale: menu.locale, placement: menu.placement, assignmentKey: menu.assignmentKey, items: savedMenuItems.filter((item) => item.menuId === menu.id).map((item) => ({ itemKey: item.itemKey, parentKey: item.parentId ? (savedMenuItems.find((parent) => parent.id === item.parentId)?.itemKey ?? null) : null, sortOrder: item.sortOrder, label: item.label, href: item.href, visible: item.visible, target: item.target })) }));
      const footerLayouts: ParsedSiteBrandingInput["footerLayouts"] = [];
      for (const layout of layouts) {
        const columns = await tx.select().from(brandingFooterColumns).where(eq(brandingFooterColumns.layoutId, layout.id)).orderBy(asc(brandingFooterColumns.sortOrder));
        const blocks = await tx.select().from(brandingFooterBlocks).where(eq(brandingFooterBlocks.layoutId, layout.id)).orderBy(asc(brandingFooterBlocks.sortOrder));
        footerLayouts.push({ locale: layout.locale, columns: columns.map((column) => ({ columnKey: column.columnKey, sortOrder: column.sortOrder, heading: column.heading, assignedMenuKey: column.assignedMenuKey ?? null, blocks: blocks.filter((block) => block.columnId === column.id).map((block) => ({ blockKey: block.blockKey, blockType: block.blockType, sortOrder: block.sortOrder, ...(typeof block.contentJson === "object" && block.contentJson && !Array.isArray(block.contentJson) ? block.contentJson : {}) })) })) } as ParsedSiteBrandingInput["footerLayouts"][number]);
      }
      const copy: ParsedSiteBrandingInput = { id, brandingKey, revisionToken, logoMediaId: published.logoMediaId?.toString() ?? null, faviconMediaId: published.faviconMediaId?.toString() ?? null, localizations: localizations.map((item) => ({ locale: item.locale, siteName: item.siteName, tagline: item.tagline, footerText: item.footerText })), menus, navigation: navigation.map((item) => ({ itemKey: item.itemKey, locale: item.locale, placement: item.placement, parentKey: null, sortOrder: item.sortOrder, label: item.label, href: item.href, openInNewTab: item.openInNewTab })), footerLayouts };
      const revision = await insertRevision(tx, found.branding.id, copy, admin.id, "draft", await nextNumber(tx, found.branding.id));
      await tx.update(brandingRevisions).set({ status: "archived" }).where(eq(brandingRevisions.id, found.draft.id));
      await tx.update(brandingRevisionPointers).set({ draftRevisionId: revision }).where(eq(brandingRevisionPointers.brandingId, found.branding.id));
      return { ok: true, revisionToken: revision.toString(), status: "draft" } as const;
    });
    logTotal(operation, started, transactionStarted);
    if (result.ok) revalidate(); return result;
  } catch (error) { console.error("[settings:discard]", error); return internal; }
}

type DraftPatch = { id: string; revisionToken: string };
export type SaveIdentityInput = DraftPatch & Pick<ParsedSiteBrandingInput, "logoMediaId" | "faviconMediaId" | "localizations">;
export type SaveHeaderInput = DraftPatch & { menuKeys?: { ar: string; en: string }; items?: { ar: SiteSettingsDocument["navigation"]["ar"]["header"]; en: SiteSettingsDocument["navigation"]["en"]["header"] } };
export type SaveMenusInput = DraftPatch & { menus?: NamedMenu[]; navigation?: SiteSettingsDocument["navigation"] };
export type SaveFooterInput = DraftPatch & { footerLayouts: FooterLayoutInput[] };

function mergedDraft(current: SiteSettingsDocument, patch: Partial<ParsedSiteBrandingInput>): ParsedSiteBrandingInput {
  return {
    id: current.id, brandingKey: "default", revisionToken: current.revisionToken,
    logoMediaId: patch.logoMediaId ?? current.logoMediaId, faviconMediaId: patch.faviconMediaId ?? current.faviconMediaId,
    localizations: patch.localizations ?? Object.entries(current.locales).map(([locale, value]) => ({ locale: locale as "ar" | "en", ...value })),
    menus: patch.menus ?? current.menus,
    navigation: patch.navigation ?? [],
    footerLayouts: patch.footerLayouts ?? current.footerLayouts,
  };
}

async function saveArea(patch: DraftPatch, area: Partial<ParsedSiteBrandingInput>): Promise<SettingsActionResult> {
  const current = await getSiteSettings();
  if (!current || current.id !== patch.id || current.revisionToken !== patch.revisionToken) return stale;
  return saveSiteBrandingDraft(mergedDraft(current, area));
}

export async function saveSiteIdentityDraft(input: SaveIdentityInput): Promise<SettingsActionResult> { return saveArea(input, input); }
export async function saveSiteHeaderDraft(input: SaveHeaderInput): Promise<SettingsActionResult> {
  const current = await getSiteSettings();
  if (!current) return notFound;
  if (input.menuKeys) {
    const menuKeys = input.menuKeys;
    if (!current.menus.some((menu) => menu.locale === "ar" && menu.placement === "header" && menu.menuKey === menuKeys.ar) || !current.menus.some((menu) => menu.locale === "en" && menu.placement === "header" && menu.menuKey === menuKeys.en)) return invalid;
    const menus = current.menus.map((menu) => menu.placement === "header" ? { ...menu, assignmentKey: menu.menuKey === menuKeys[menu.locale] ? "header-primary" : null } : menu);
    return saveArea(input, { menus });
  }
  if (!input.items) return invalid;
  const menus = current.menus.map((menu) => menu.placement === "header" ? { ...menu, items: (menu.locale === "ar" ? input.items!.ar : input.items!.en).map((item) => ({ itemKey: item.itemKey, parentKey: null, sortOrder: item.sortOrder, label: item.label, href: item.href, visible: true, target: item.openInNewTab ? "_blank" as const : "_self" as const })) } : menu);
  return saveArea(input, { menus });
}
export async function saveSiteMenusDraft(input: SaveMenusInput): Promise<SettingsActionResult> {
  if (input.menus) return saveArea(input, { menus: input.menus });
  if (!input.navigation) return invalid;
  const menus: NamedMenu[] = Object.entries(input.navigation).flatMap(([locale, placements]) => (["header", "footer"] as const).map((placement) => ({ menuKey: placement === "header" ? "header-primary" : "footer-quick-links", name: placement === "header" ? "Primary navigation" : "Quick links", locale: locale as "ar" | "en", placement, assignmentKey: placement === "header" ? "header-primary" : "quick-links", items: placements[placement].map((item) => ({ itemKey: item.itemKey, parentKey: null, sortOrder: item.sortOrder, label: item.label, href: item.href, visible: true, target: item.openInNewTab ? "_blank" as const : "_self" as const })) })));
  return saveArea(input, { menus });
}
export async function saveSiteFooterDraft(input: SaveFooterInput): Promise<SettingsActionResult> { return saveArea(input, { footerLayouts: input.footerLayouts }); }

// Publish and discard intentionally operate on the shared revision pointer. Area
// saves above only replace the selected portion of the next draft revision.

