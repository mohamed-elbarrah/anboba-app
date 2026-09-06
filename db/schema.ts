import {
  bigint,
  index,
  int,
  json,
  foreignKey,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const locales = ["ar", "en"] as const;
export const revisionStatuses = ["draft", "published", "archived"] as const;
export const contactMessageStatuses = ["unread", "read", "replied", "archived"] as const;

/** Fixed section keys from the approved initial CMS page map. */
export const sectionKeys = [
  "hero",
  "service_overview",
  "statistics",
  "why_choose_us",
  "service_benefits",
  "join_application",
  "faq_support",
  "vision_mission",
  "contact",
  "partner_registration",
  "policies",
] as const;

const id = (name: string) => bigint(name, { mode: "bigint", unsigned: true });
const createdAt = () => timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () =>
  timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow();

/** Stable page identity. Content and metadata live in page revisions. */
export const pages = mysqlTable(
  "pages",
  {
    id: id("id").autoincrement().primaryKey(),
    locale: mysqlEnum("locale", locales).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    createdAt: createdAt(),
    // This changes when page identity or revision pointers change. Revision
    // content timestamps live on page_revisions and do not mutate this row.
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("pages_locale_slug_unique").on(table.locale, table.slug)],
);

/** Revisions are the versioned, metadata-bearing page documents. Published rows are immutable by application policy. */
export const pageRevisions = mysqlTable(
  "page_revisions",
  {
    id: id("id").autoincrement().primaryKey(),
    pageId: id("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "restrict", onUpdate: "cascade" }),
    revisionNumber: int("revision_number", { unsigned: true }).notNull(),
    status: mysqlEnum("status", revisionStatuses).notNull().default("draft"),
    title: varchar("title", { length: 255 }).notNull(),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("page_revisions_page_number_unique").on(table.pageId, table.revisionNumber),
    // Required parent key for the composite ownership foreign keys below.
    uniqueIndex("page_revisions_page_id_id_unique").on(table.pageId, table.id),
    index("page_revisions_page_status_idx").on(table.pageId, table.status),
  ],
);

/**
 * Optional draft/published pointers are separated from pages so ownership can
 * be enforced without a cyclic pages <-> page_revisions declaration.
 */
export const pageRevisionPointers = mysqlTable(
  "page_revision_pointers",
  {
    pageId: id("page_id").primaryKey(),
    draftRevisionId: id("draft_revision_id"),
    publishedRevisionId: id("published_revision_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "page_revision_pointers_page_fk",
      columns: [table.pageId],
      foreignColumns: [pages.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      name: "page_revision_pointers_draft_revision_fk",
      columns: [table.pageId, table.draftRevisionId],
      foreignColumns: [pageRevisions.pageId, pageRevisions.id],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    foreignKey({
      name: "page_revision_pointers_published_revision_fk",
      columns: [table.pageId, table.publishedRevisionId],
      foreignColumns: [pageRevisions.pageId, pageRevisions.id],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
  ],
);

export const pageSections = mysqlTable(
  "page_sections",
  {
    id: id("id").autoincrement().primaryKey(),
    revisionId: id("revision_id")
      .notNull()
      .references(() => pageRevisions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sectionKey: mysqlEnum("section_key", sectionKeys).notNull(),
    sectionType: mysqlEnum("section_type", sectionKeys).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    contentJson: json("content_json").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("page_sections_revision_key_unique").on(table.revisionId, table.sectionKey),
    uniqueIndex("page_sections_revision_order_unique").on(table.revisionId, table.sortOrder),
  ],
);

export const settings = mysqlTable(
  "settings",
  {
    id: id("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 191 }).notNull(),
    valueJson: json("value_json").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("settings_key_unique").on(table.key)],
);

export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: id("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    subject: varchar("subject", { length: 255 }),
    message: text("message").notNull(),
    status: mysqlEnum("status", contactMessageStatuses).notNull().default("unread"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("contact_messages_status_created_idx").on(table.status, table.createdAt),
    // 191 characters = 764 bytes under utf8mb4, within older MySQL index limits.
    index("contact_messages_email_idx").on(sql.raw("`email`(191)")),
  ],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageRevision = typeof pageRevisions.$inferSelect;
export type NewPageRevision = typeof pageRevisions.$inferInsert;
export type PageRevisionPointers = typeof pageRevisionPointers.$inferSelect;
export type NewPageRevisionPointers = typeof pageRevisionPointers.$inferInsert;
export type PageSection = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
