import { loadEnvConfig } from "@next/env";
import { and, eq, inArray } from "drizzle-orm";
import ar from "../dictionaries/ar.json" with { type: "json" };
import en from "../dictionaries/en.json" with { type: "json" };
import { closePool, getDb, getPool } from "../db/connection";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../db/schema";
import {
  brandingFooterBlocks,
  brandingFooterColumns,
  brandingFooterLayouts,
  brandingRevisionMenuItems,
  brandingRevisionMenus,
  brandingRevisionPointers,
  brandingRevisions,
  siteBranding,
} from "../db/schema";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";

loadEnvConfig(process.cwd());

const dictionaries = { ar, en } as const;
type Locale = keyof typeof dictionaries;
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

function footerLinks(locale: Locale) {
  const dictionary = dictionaries[locale];
  return [
    { itemKey: "about", label: dictionary.pages.about, href: `/${locale}/about` },
    { itemKey: "terms", label: dictionary.footer.terms, href: `/${locale}/policies/terms` },
    { itemKey: "privacy", label: dictionary.footer.privacy, href: `/${locale}/policies/privacy` },
    { itemKey: "refunds", label: dictionary.footer.refunds, href: `/${locale}/policies/refunds` },
  ];
}

function canonicalColumns(locale: Locale) {
  const dictionary = dictionaries[locale];
  return [
    {
      key: "brand",
      order: 0,
      heading: null,
      menuKey: null,
      blocks: [{ key: "description", type: "text" as const, order: 0, content: { title: null, text: dictionary.footer.brandDescription } }],
    },
    {
      key: "quick-links",
      order: 1,
      heading: dictionary.footer.quickLinks,
      menuKey: "footer-quick-links",
      blocks: [{ key: "links", type: "link_group" as const, order: 0, content: { title: null, links: footerLinks(locale).map((item) => ({ label: item.label, href: item.href, openInNewTab: false })) } }],
    },
    {
      key: "contact",
      order: 2,
      heading: dictionary.footer.contact,
      menuKey: null,
      blocks: [{
        key: "contact",
        type: "contact" as const,
        order: 0,
        content: {
          title: null,
          items: [
            { kind: "phone" as const, label: dictionary.footer.phoneLabel, value: dictionary.footer.phone, href: `tel:${dictionary.footer.phone.replace(/\D/g, "")}` },
            { kind: "email" as const, label: dictionary.footer.emailLabel, value: dictionary.footer.email, href: `mailto:${dictionary.footer.email}` },
            { kind: "address" as const, label: dictionary.footer.addressLabel, value: dictionary.footer.address }
          ],
        },
      }],
    },
  ];
}

function firstFreeOrder(used: Set<number>, preferred: number) {
  if (!used.has(preferred)) return preferred;
  let order = used.size ? Math.max(...used) + 1 : 0;
  while (used.has(order)) order += 1;
  return order;
}

async function repairRevision(tx: Tx, revisionId: bigint) {
  for (const locale of Object.keys(dictionaries) as Locale[]) {
    const existingMenus = await tx.select().from(brandingRevisionMenus).where(and(eq(brandingRevisionMenus.revisionId, revisionId), eq(brandingRevisionMenus.locale, locale)));
    const menus = new Map(existingMenus.map((menu) => [menu.menuKey, menu]));
    const dictionary = dictionaries[locale];
    const canonicalMenus = [
      { key: "footer-quick-links", name: dictionary.footer.quickLinks, assignmentKey: "quick-links" },
    ];
    for (const menu of canonicalMenus) {
      let row = menus.get(menu.key);
      if (!row) {
        const result = await tx.insert(brandingRevisionMenus).values({ revisionId, locale, menuKey: menu.key, name: menu.name, placement: "footer", assignmentKey: menu.assignmentKey });
        row = { id: BigInt(result[0].insertId), revisionId, locale, menuKey: menu.key } as typeof existingMenus[number];
        menus.set(menu.key, row);
      }
      if (menu.key !== "footer-quick-links") continue;
      await tx.update(brandingRevisionMenus).set({ placement: "footer", assignmentKey: "quick-links" }).where(eq(brandingRevisionMenus.id, row.id));
      const items = await tx.select({ itemKey: brandingRevisionMenuItems.itemKey, sortOrder: brandingRevisionMenuItems.sortOrder }).from(brandingRevisionMenuItems).where(eq(brandingRevisionMenuItems.menuId, row.id));
      const itemKeys = new Set(items.map((item) => item.itemKey));
      const orders = new Set(items.map((item) => item.sortOrder));
      for (const item of footerLinks(locale)) {
        if (itemKeys.has(item.itemKey)) continue;
        const sortOrder = firstFreeOrder(orders, footerLinks(locale).findIndex((candidate) => candidate.itemKey === item.itemKey));
        await tx.insert(brandingRevisionMenuItems).values({ menuId: row.id, revisionId, locale, itemKey: item.itemKey, parentId: null, sortOrder, label: item.label, href: item.href, visible: true, target: "_self" });
        orders.add(sortOrder);
      }
    }

    let layout = (await tx.select().from(brandingFooterLayouts).where(and(eq(brandingFooterLayouts.revisionId, revisionId), eq(brandingFooterLayouts.locale, locale))).limit(1))[0];
    if (!layout) {
      const result = await tx.insert(brandingFooterLayouts).values({ revisionId, locale });
      layout = { id: BigInt(result[0].insertId), revisionId, locale } as typeof layout;
    }
    const columns = await tx.select().from(brandingFooterColumns).where(eq(brandingFooterColumns.layoutId, layout.id));
    // Footer columns are content-owned except for the single quick-links menu.
    // Clear assignments first so retired footer menus can be removed safely.
    await tx.update(brandingFooterColumns).set({ assignedMenuKey: null }).where(eq(brandingFooterColumns.layoutId, layout.id));
    const obsoleteMenus = existingMenus.filter((menu) => menu.placement === "footer" && menu.menuKey !== "footer-quick-links");
    if (obsoleteMenus.length) {
      const obsoleteMenuIds = obsoleteMenus.map((menu) => menu.id);
      await tx.delete(brandingRevisionMenuItems).where(inArray(brandingRevisionMenuItems.menuId, obsoleteMenuIds));
      await tx.delete(brandingRevisionMenus).where(inArray(brandingRevisionMenus.id, obsoleteMenuIds));
    }
    const columnsByKey = new Map(columns.map((column) => [column.columnKey, column]));
    const columnOrders = new Set(columns.map((column) => column.sortOrder));
    for (const canonical of canonicalColumns(locale)) {
      let column = columnsByKey.get(canonical.key);
      if (!column) {
        const sortOrder = firstFreeOrder(columnOrders, canonical.order);
        const result = await tx.insert(brandingFooterColumns).values({ layoutId: layout.id, revisionId, locale, columnKey: canonical.key, sortOrder, heading: canonical.heading, assignedMenuKey: canonical.menuKey });
        column = { id: BigInt(result[0].insertId), layoutId: layout.id, revisionId, locale, columnKey: canonical.key } as typeof columns[number];
        columnsByKey.set(canonical.key, column);
        columnOrders.add(sortOrder);
      }
      // Only the quick-links/link-group column may own a named menu.
      await tx.update(brandingFooterColumns).set({ assignedMenuKey: canonical.menuKey }).where(eq(brandingFooterColumns.id, column.id));
      const blocks = await tx.select({ blockKey: brandingFooterBlocks.blockKey }).from(brandingFooterBlocks).where(eq(brandingFooterBlocks.columnId, column.id));
      const blockKeys = new Set(blocks.map((block) => block.blockKey));
      const blockRows = await tx.select({ sortOrder: brandingFooterBlocks.sortOrder }).from(brandingFooterBlocks).where(eq(brandingFooterBlocks.columnId, column.id));
      const blockOrders = new Set(blockRows.map((block) => block.sortOrder));
      for (const block of canonical.blocks) {
        if (blockKeys.has(block.key)) {
          if (block.type === "contact") {
            const existing = (await tx.select().from(brandingFooterBlocks).where(and(eq(brandingFooterBlocks.columnId, column.id), eq(brandingFooterBlocks.blockKey, block.key))).limit(1))[0];
            const content = existing?.contentJson;
            const items = content && typeof content === "object" && !Array.isArray(content) && Array.isArray((content as { items?: unknown[] }).items)
              ? (content as { items: unknown[] }).items
              : [];
            if (existing) {
              // Repair the contract in place while preserving every non-empty
              // admin-authored value. Legacy `location` is the same field as
              // the corrected `address` field; other contact kinds are retired.
              const canonicalItems = block.content.items;
              const normalizedItems = canonicalItems.map((canonical) => {
                const match = items.find((item) => {
                  if (!item || typeof item !== "object") return false;
                  const candidate = item as { kind?: unknown; value?: unknown };
                  const kind = candidate.kind === "location" ? "address" : candidate.kind;
                  return kind === canonical.kind && typeof candidate.value === "string" && candidate.value.trim().length > 0;
                }) as { label?: unknown; value?: unknown } | undefined;
                const value = typeof match?.value === "string" && match.value.trim() ? match.value : canonical.value;
                const label = typeof match?.label === "string" && match.label.trim() ? match.label : canonical.label;
                const href = canonical.kind === "phone"
                  ? `tel:${value.replace(/\D/g, "")}`
                  : canonical.kind === "email"
                    ? `mailto:${value}`
                    : undefined;
                return { kind: canonical.kind, label, value, ...(href ? { href } : {}) };
              });
              const title = content && typeof content === "object" && !Array.isArray(content) && typeof (content as { title?: unknown }).title === "string"
                ? (content as { title: string }).title
                : null;
              await tx.update(brandingFooterBlocks).set({ contentJson: { title, items: normalizedItems } }).where(eq(brandingFooterBlocks.id, existing.id));
            }
          }
          continue;
        }
        const sortOrder = firstFreeOrder(blockOrders, block.order);
        await tx.insert(brandingFooterBlocks).values({ columnId: column.id, layoutId: layout.id, revisionId, locale, blockKey: block.key, blockType: block.type, sortOrder, contentJson: block.content });
        blockOrders.add(sortOrder);
      }
    }
  }
}

async function repair() {
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  let acquired = false;
  try {
    await acquireDataLock(connection);
    acquired = true;
    await db.transaction(async (tx) => {
      const branding = (await tx.select().from(siteBranding).where(eq(siteBranding.brandingKey, "default")).limit(1))[0];
      if (!branding) throw new Error("Default site branding does not exist; run db:seed:branding first");
      const pointer = (await tx.select().from(brandingRevisionPointers).where(eq(brandingRevisionPointers.brandingId, branding.id)).limit(1))[0];
      if (!pointer?.draftRevisionId || !pointer.publishedRevisionId) throw new Error("Default site branding has no valid draft and published pointers; refusing repair");
      const revisions = await tx.select({ id: brandingRevisions.id, status: brandingRevisions.status }).from(brandingRevisions).where(and(eq(brandingRevisions.brandingId, branding.id), inArray(brandingRevisions.id, [pointer.draftRevisionId, pointer.publishedRevisionId])));
      const draft = revisions.find((revision) => revision.id === pointer.draftRevisionId && revision.status === "draft");
      const published = revisions.find((revision) => revision.id === pointer.publishedRevisionId && revision.status === "published");
      if (!draft || !published) throw new Error("Default site branding pointers are invalid; refusing repair");
      await repairRevision(tx, draft.id);
      await repairRevision(tx, published.id);
    });
  } finally {
    try { if (acquired) await releaseDataLock(connection); } finally { connection.release(); }
  }
  console.log("Site branding footer contract repair complete.");
}

repair().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => closePool());
