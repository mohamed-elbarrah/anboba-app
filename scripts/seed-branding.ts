import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import ar from "../dictionaries/ar.json" with { type: "json" };
import en from "../dictionaries/en.json" with { type: "json" };
import { closePool, getDb, getPool } from "../db/connection";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../db/schema";
import {
  admins,
  brandingNavigationItems,
  brandingRevisionMenus,
  brandingRevisionMenuItems,
  brandingFooterBlocks,
  brandingFooterColumns,
  brandingFooterLayouts,
  brandingRevisionLocalizations,
  brandingRevisionPointers,
  brandingRevisions,
  siteBranding,
} from "../db/schema";
import { getDownloadAppHref } from "../lib/navigation";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";

loadEnvConfig(process.cwd());

const dictionaries = { ar, en } as const;
type Locale = keyof typeof dictionaries;
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

function navigation(locale: Locale, placement: "header" | "footer") {
  const dictionary = dictionaries[locale];
  if (placement === "header") {
    return [
      { itemKey: "home", label: dictionary.pages.home, href: `/${locale}` },
      { itemKey: "about", label: dictionary.pages.about, href: `/${locale}/about` },
      { itemKey: "contact", label: dictionary.pages.contact, href: `/${locale}/contact` },
      { itemKey: "joinUs", label: dictionary.pages.joinUs, href: `/${locale}/join-us` },
      { itemKey: "cta", label: dictionary.pages.downloadApp, href: getDownloadAppHref(locale) },
    ];
  }
  return [
    { itemKey: "about", label: dictionary.pages.about, href: `/${locale}/about` },
    { itemKey: "terms", label: dictionary.footer.terms, href: `/${locale}/policies/terms` },
    { itemKey: "privacy", label: dictionary.footer.privacy, href: `/${locale}/policies/privacy` },
    { itemKey: "refunds", label: dictionary.footer.refunds, href: `/${locale}/policies/refunds` },
  ];
}

function footerLayout(locale: Locale) {
  const dictionary = dictionaries[locale];
  return {
    locale,
    columns: [
      {
        columnKey: "brand",
        sortOrder: 0,
        heading: null,
        blocks: [{ blockKey: "description", blockType: "text" as const, sortOrder: 0, title: null, text: dictionary.footer.brandDescription }],
      },
      {
        columnKey: "quick-links",
        sortOrder: 1,
        heading: dictionary.footer.quickLinks,
        blocks: [{
          blockKey: "links",
          blockType: "link_group" as const,
          sortOrder: 0,
          title: null,
          links: navigation(locale, "footer").map((item) => ({ label: item.label, href: item.href, openInNewTab: false })),
        }],
      },
      {
        columnKey: "contact",
        sortOrder: 2,
        heading: dictionary.footer.contact,
        blocks: [
          {
            blockKey: "contact",
            blockType: "contact" as const,
            sortOrder: 0,
            title: null,
            items: [
              { kind: "phone" as const, label: dictionary.footer.phoneLabel, value: dictionary.footer.phone, href: `tel:${dictionary.footer.phone.replace(/\D/g, "")}` },
              { kind: "email" as const, label: dictionary.footer.emailLabel, value: dictionary.footer.email, href: `mailto:${dictionary.footer.email}` },
              { kind: "address" as const, label: dictionary.footer.addressLabel, value: dictionary.footer.address }
            ],
          },
        ],
      },
    ],
  };
}

async function insertRevision(tx: Tx, brandingId: bigint, adminId: bigint, status: "draft" | "published", revisionNumber: number, logoMediaId: bigint | null) {
  const inserted = await tx.insert(brandingRevisions).values({
    brandingId,
    revisionNumber,
    status,
    logoMediaId,
    darkLogoMediaId: null,
    faviconMediaId: null,
    createdBy: adminId,
  });
  const revisionId = BigInt(inserted[0].insertId);

  await tx.insert(brandingRevisionLocalizations).values(
    (Object.entries(dictionaries) as [Locale, (typeof dictionaries)[Locale]][]).map(([locale, dictionary]) => ({
      revisionId,
      locale,
      siteName: "ANBOBA",
      tagline: null,
      footerText: dictionary.footer.brandDescription,
    })),
  );

  await tx.insert(brandingRevisionMenus).values(
    (Object.entries(dictionaries) as [Locale, (typeof dictionaries)[Locale]][]).flatMap(([locale, dictionary]) => [
      { revisionId, locale, menuKey: "header-primary", name: locale === "ar" ? "القائمة الرئيسية" : "Primary navigation", placement: "header" as const, assignmentKey: "header-primary" },
      { revisionId, locale, menuKey: "footer-quick-links", name: dictionary.footer.quickLinks, placement: "footer" as const, assignmentKey: "quick-links" },
    ]),
  );

  const menus = await tx.select({ id: brandingRevisionMenus.id, locale: brandingRevisionMenus.locale, menuKey: brandingRevisionMenus.menuKey })
    .from(brandingRevisionMenus)
    .where(eq(brandingRevisionMenus.revisionId, revisionId));
  const menuId = (locale: Locale, menuKey: string) => menus.find((menu) => menu.locale === locale && menu.menuKey === menuKey)?.id;
  await tx.insert(brandingRevisionMenuItems).values(
    (Object.entries(dictionaries) as [Locale, (typeof dictionaries)[Locale]][]).flatMap(([locale]) =>
      navigation(locale, "header").map((item, sortOrder) => ({
        menuId: menuId(locale, "header-primary")!, revisionId, locale, itemKey: item.itemKey, parentId: null, sortOrder,
        label: item.label, href: item.href, visible: true, target: "_self" as const,
      })),
    ).concat((Object.entries(dictionaries) as [Locale, (typeof dictionaries)[Locale]][]).flatMap(([locale]) =>
      navigation(locale, "footer").map((item, sortOrder) => ({
        menuId: menuId(locale, "footer-quick-links")!, revisionId, locale, itemKey: item.itemKey, parentId: null, sortOrder,
        label: item.label, href: item.href, visible: true, target: "_self" as const,
      })),
    )),
  );

  await tx.insert(brandingNavigationItems).values(
    (Object.entries(dictionaries) as [Locale, (typeof dictionaries)[Locale]][]).flatMap(([locale]) =>
      (["header", "footer"] as const).flatMap((placement) =>
        navigation(locale, placement).map((item, sortOrder) => ({
          revisionId,
          locale,
          placement,
          itemKey: item.itemKey,
          parentId: null,
          sortOrder,
          label: item.label,
          href: item.href,
          openInNewTab: false,
          iconMediaId: null,
        })),
      ),
    ),
  );

  for (const locale of Object.keys(dictionaries) as Locale[]) {
    const layout = footerLayout(locale);
    const insertedLayout = await tx.insert(brandingFooterLayouts).values({ revisionId, locale });
    const layoutId = BigInt(insertedLayout[0].insertId);
    for (const column of layout.columns) {
      const insertedColumn = await tx.insert(brandingFooterColumns).values({
        layoutId,
        revisionId,
        locale,
        columnKey: column.columnKey,
        sortOrder: column.sortOrder,
        heading: column.heading,
        assignedMenuKey: column.columnKey === "quick-links"
          ? "footer-quick-links"
          : null,
      });
      const columnId = BigInt(insertedColumn[0].insertId);
      for (const block of column.blocks) {
        const { blockKey, blockType, sortOrder, ...content } = block;
        await tx.insert(brandingFooterBlocks).values({
          columnId,
          layoutId,
          revisionId,
          locale,
          blockKey,
          blockType,
          sortOrder,
          contentJson: content,
        });
      }
    }
  }

  return revisionId;
}

async function seed() {
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  let acquired = false;
  try {
    await acquireDataLock(connection);
    acquired = true;
    await db.transaction(async (tx) => {
      let branding = (await tx.select().from(siteBranding).where(eq(siteBranding.brandingKey, "default")).limit(1))[0];
      if (branding) {
        const pointer = (await tx.select().from(brandingRevisionPointers).where(eq(brandingRevisionPointers.brandingId, branding.id)).limit(1))[0];
        if (!pointer) {
          const revisions = await tx.select({ id: brandingRevisions.id }).from(brandingRevisions).where(eq(brandingRevisions.brandingId, branding.id)).limit(1);
          if (revisions.length) throw new Error("Default site branding has revisions but no pointer; refusing to choose CMS content");
        } else if (pointer.draftRevisionId && pointer.publishedRevisionId) {
          const revisions = await tx.select({ id: brandingRevisions.id, status: brandingRevisions.status }).from(brandingRevisions).where(eq(brandingRevisions.brandingId, branding.id));
          const draft = revisions.find((revision) => revision.id === pointer.draftRevisionId);
          const published = revisions.find((revision) => revision.id === pointer.publishedRevisionId);
          if (draft?.status === "draft" && published?.status === "published") return;
          throw new Error("Default site branding pointers are invalid; refusing to repoint CMS content");
        } else {
          throw new Error("Default site branding has an incomplete pointer; refusing to repoint CMS content");
        }
      }

      const admin = (await tx.select({ id: admins.id }).from(admins).where(eq(admins.isActive, true)).limit(1))[0];
      if (!admin) throw new Error("An active admin is required before seeding site branding");
      if (!branding) {
        await tx.insert(siteBranding).values({ brandingKey: "default" });
        branding = (await tx.select().from(siteBranding).where(eq(siteBranding.brandingKey, "default")).limit(1))[0];
        if (!branding) throw new Error("Could not create default site branding");
      }

      // Static assets are deliberately not registered as media: media rows
      // represent files owned by storageDirectory() and require an uploader.
      // Null selections make the public shell use its checked-in logo and
      // favicon fallbacks, while uploaded media can be selected later.
      const published = await insertRevision(tx, branding.id, admin.id, "published", 1, null);
      const draft = await insertRevision(tx, branding.id, admin.id, "draft", 2, null);
      await tx.insert(brandingRevisionPointers).values({ brandingId: branding.id, draftRevisionId: draft, publishedRevisionId: published });
    });
  } finally {
    try {
      if (acquired) await releaseDataLock(connection);
    } finally {
      connection.release();
    }
  }
  console.log("Site branding seed complete.");
}

seed().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => closePool());
