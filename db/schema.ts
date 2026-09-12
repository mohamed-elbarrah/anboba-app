import {
  bigint,
  boolean,
  index,
  int,
  json,
  foreignKey,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const locales = ["ar", "en"] as const;
export const adminRoles = ["admin"] as const;
export const revisionStatuses = ["draft", "published", "archived"] as const;
export const contactMessageStatuses = ["unread", "read", "replied", "archived"] as const;
export const submissionStatuses = ["new", "in_review", "accepted", "rejected", "archived"] as const;
export const submissionNotificationStatuses = ["pending", "sent", "failed"] as const;
export const formRendererKeys = [
  "contact",
  "join_application",
  "partner_registration",
  "generic",
] as const;
export const formKinds = ["system", "user"] as const;
export const formRendererModes = ["legacy", "flexible"] as const;
export const formFieldTypes = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "date",
  // Protected legacy-only type. Generic and normalized application allowlists reject it.
  "file",
] as const;
export const formFieldWidths = ["full", "half", "third"] as const;

/** Fixed section keys from the approved initial CMS page map. */
export const sectionKeys = [
  "hero",
  "service_overview",
  "statistics",
  "why_choose_us",
  "service_benefits",
  "join_application",
  "faq_support",
  "faq",
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

/** Stable form identity. Renderer keys are code-owned and allowlisted. */
export const forms = mysqlTable(
  "forms",
  {
    id: id("id").autoincrement().primaryKey(),
    formKey: varchar("form_key", { length: 100 }).notNull(),
    rendererKey: mysqlEnum("renderer_key", formRendererKeys).notNull(),
    kind: mysqlEnum("kind", formKinds).notNull().default("user"),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("forms_form_key_unique").on(table.formKey),
    index("forms_renderer_archived_idx").on(table.rendererKey, table.archived),
  ],
);

/** Locale-specific immutable form configuration revisions. */
export const formRevisions = mysqlTable(
  "form_revisions",
  {
    id: id("id").autoincrement().primaryKey(),
    formId: id("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "restrict", onUpdate: "cascade" }),
    locale: mysqlEnum("locale", locales).notNull(),
    revisionNumber: int("revision_number", { unsigned: true }).notNull(),
    status: mysqlEnum("status", revisionStatuses).notNull().default("draft"),
    // Nullable for additive rollout: existing revisions remain legacy until a
    // later, explicit migration/seed step classifies them.
    rendererMode: mysqlEnum("renderer_mode", formRendererModes),
    templateKey: varchar("template_key", { length: 100 }),
    configJson: json("config_json").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("form_revisions_form_locale_number_unique").on(
      table.formId,
      table.locale,
      table.revisionNumber,
    ),
    // Required parent key for ownership-enforcing pointer foreign keys.
    uniqueIndex("form_revisions_form_locale_id_unique").on(table.formId, table.locale, table.id),
    index("form_revisions_form_locale_status_idx").on(table.formId, table.locale, table.status),
    index("form_revisions_renderer_mode_template_idx").on(table.rendererMode, table.templateKey),
  ],
);

/** Structural, allowlisted fields belonging to one immutable revision. */
export const formRevisionFields = mysqlTable(
  "form_revision_fields",
  {
    id: id("id").autoincrement().primaryKey(),
    revisionId: id("revision_id").notNull(),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    fieldType: mysqlEnum("field_type", formFieldTypes).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    required: boolean("required").notNull().default(false),
    validationPreset: varchar("validation_preset", { length: 80 }),
    width: mysqlEnum("width", formFieldWidths).notNull().default("full"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("form_revision_fields_revision_key_unique").on(table.revisionId, table.fieldKey),
    uniqueIndex("form_revision_fields_revision_order_unique").on(table.revisionId, table.sortOrder),
    uniqueIndex("form_revision_fields_revision_id_unique").on(table.revisionId, table.id),
    foreignKey({
      name: "form_revision_fields_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [formRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Bilingual field copy; the revision id prevents cross-revision localization. */
export const formFieldLocalizations = mysqlTable(
  "form_field_localizations",
  {
    fieldId: id("field_id").notNull(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    placeholder: varchar("placeholder", { length: 255 }),
    helpText: text("help_text"),
    validationMessage: varchar("validation_message", { length: 500 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.fieldId, table.locale] }),
    index("form_field_localizations_revision_locale_idx").on(table.revisionId, table.locale),
    foreignKey({
      name: "form_field_localizations_field_fk",
      columns: [table.revisionId, table.fieldId],
      foreignColumns: [formRevisionFields.revisionId, formRevisionFields.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Allowlisted options belong to a select/radio field revision. */
export const formFieldOptions = mysqlTable(
  "form_field_options",
  {
    id: id("id").autoincrement().primaryKey(),
    fieldId: id("field_id").notNull(),
    optionKey: varchar("option_key", { length: 100 }).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("form_field_options_field_key_unique").on(table.fieldId, table.optionKey),
    uniqueIndex("form_field_options_field_order_unique").on(table.fieldId, table.sortOrder),
    uniqueIndex("form_field_options_field_id_unique").on(table.fieldId, table.id),
    foreignKey({
      name: "form_field_options_field_fk",
      columns: [table.fieldId],
      foreignColumns: [formRevisionFields.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const formFieldOptionLocalizations = mysqlTable(
  "form_field_option_localizations",
  {
    optionId: id("option_id").notNull(),
    fieldId: id("field_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.optionId, table.locale] }),
    index("form_field_option_localizations_field_locale_idx").on(table.fieldId, table.locale),
    foreignKey({
      name: "form_field_option_localizations_option_fk",
      columns: [table.fieldId, table.optionId],
      foreignColumns: [formFieldOptions.fieldId, formFieldOptions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Revision-scoped form copy (submit/success/error text and builder metadata). */
export const formRevisionCopy = mysqlTable(
  "form_revision_copy",
  {
    revisionId: id("revision_id").primaryKey(),
    submitLabel: varchar("submit_label", { length: 255 }),
    successMessage: text("success_message"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "form_revision_copy_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [formRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Draft/published pointers keep each locale's form lifecycle independent. */
export const formRevisionPointers = mysqlTable(
  "form_revision_pointers",
  {
    formId: id("form_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    draftRevisionId: id("draft_revision_id"),
    publishedRevisionId: id("published_revision_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.formId, table.locale] }),
    foreignKey({
      name: "form_revision_pointers_form_fk",
      columns: [table.formId],
      foreignColumns: [forms.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      name: "form_revision_pointers_draft_revision_fk",
      columns: [table.formId, table.locale, table.draftRevisionId],
      foreignColumns: [formRevisions.formId, formRevisions.locale, formRevisions.id],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    foreignKey({
      name: "form_revision_pointers_published_revision_fk",
      columns: [table.formId, table.locale, table.publishedRevisionId],
      foreignColumns: [formRevisions.formId, formRevisions.locale, formRevisions.id],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
  ],
);

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
    // Nullable reusable form identity; references are intentionally restrictive.
    formId: id("form_id").references(() => forms.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
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

export const admins = mysqlTable(
  "admins",
  {
    id: id("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    emailNormalized: varchar("email_normalized", { length: 320 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", adminRoles).notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    passwordChangedAt: timestamp("password_changed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("admins_email_unique").on(table.email),
    uniqueIndex("admins_email_normalized_unique").on(table.emailNormalized),
  ],
);

export const adminSessions = mysqlTable(
  "admin_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    adminId: id("admin_id").notNull().references(() => admins.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_unique").on(table.tokenHash),
    index("admin_sessions_admin_expires_idx").on(table.adminId, table.expiresAt),
  ],
);

export const authLoginAttempts = mysqlTable(
  "auth_login_attempts",
  {
    identifier: varchar("identifier", { length: 400 }).primaryKey(),
    failures: int("failures", { unsigned: true }).notNull().default(0),
    firstAttemptAt: timestamp("first_attempt_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lockedUntil: timestamp("locked_until"),
    updatedAt: updatedAt(),
  },
  (table) => [index("auth_login_attempts_locked_idx").on(table.lockedUntil)],
);

export const mediaKinds = ["image", "video"] as const;
export const navigationPlacements = ["header", "footer"] as const;
export const navigationTargets = ["_self", "_blank"] as const;

export const policyDocuments = mysqlTable(
  "policy_documents",
  {
    id: id("id").autoincrement().primaryKey(),
    locale: mysqlEnum("locale", locales).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    archivedAt: timestamp("archived_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("policy_documents_locale_slug_unique").on(table.locale, table.slug)],
);

export const policyRevisions = mysqlTable(
  "policy_revisions",
  {
    id: id("id").autoincrement().primaryKey(),
    policyDocumentId: id("policy_document_id").notNull().references(() => policyDocuments.id, { onDelete: "cascade", onUpdate: "cascade" }),
    revisionNumber: int("revision_number", { unsigned: true }).notNull(),
    status: mysqlEnum("status", revisionStatuses).notNull().default("draft"),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    contentJson: json("content_json").notNull(),
    createdBy: id("created_by").notNull().references(() => admins.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("policy_revisions_document_number_unique").on(table.policyDocumentId, table.revisionNumber),
    uniqueIndex("policy_revisions_document_id_id_unique").on(table.policyDocumentId, table.id),
    index("policy_revisions_document_status_idx").on(table.policyDocumentId, table.status),
  ],
);

export const policyRevisionPointers = mysqlTable(
  "policy_revision_pointers",
  {
    policyDocumentId: id("policy_document_id").primaryKey(),
    draftRevisionId: id("draft_revision_id"),
    publishedRevisionId: id("published_revision_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({ name: "policy_revision_pointers_document_fk", columns: [table.policyDocumentId], foreignColumns: [policyDocuments.id] }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({ name: "policy_revision_pointers_draft_fk", columns: [table.policyDocumentId, table.draftRevisionId], foreignColumns: [policyRevisions.policyDocumentId, policyRevisions.id] }).onDelete("restrict").onUpdate("restrict"),
    foreignKey({ name: "policy_revision_pointers_published_fk", columns: [table.policyDocumentId, table.publishedRevisionId], foreignColumns: [policyRevisions.policyDocumentId, policyRevisions.id] }).onDelete("restrict").onUpdate("restrict"),
  ],
);


export const media = mysqlTable(
  "media",
  {
    id: id("id").autoincrement().primaryKey(),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    publicPath: varchar("public_path", { length: 500 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    kind: mysqlEnum("kind", mediaKinds).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number", unsigned: true }).notNull(),
    uploadedBy: id("uploaded_by").notNull().references(() => admins.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("media_storage_key_unique").on(table.storageKey),
    index("media_kind_created_idx").on(table.kind, table.createdAt),
    index("media_uploaded_by_idx").on(table.uploadedBy),
  ],
);

/** Stable site-wide branding identity; revisions publish branding and navigation atomically. */
export const siteBranding = mysqlTable(
  "site_branding",
  {
    id: id("id").autoincrement().primaryKey(),
    brandingKey: varchar("branding_key", { length: 50 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("site_branding_key_unique").on(table.brandingKey)],
);

/** Immutable, admin-authored site shell revisions. */
export const brandingRevisions = mysqlTable(
  "branding_revisions",
  {
    id: id("id").autoincrement().primaryKey(),
    brandingId: id("branding_id")
      .notNull()
      .references(() => siteBranding.id, { onDelete: "restrict", onUpdate: "cascade" }),
    revisionNumber: int("revision_number", { unsigned: true }).notNull(),
    status: mysqlEnum("status", revisionStatuses).notNull().default("draft"),
    logoMediaId: id("logo_media_id").references(() => media.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    darkLogoMediaId: id("dark_logo_media_id").references(() => media.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    faviconMediaId: id("favicon_media_id").references(() => media.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    createdBy: id("created_by").notNull().references(() => admins.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_revisions_branding_number_unique").on(
      table.brandingId,
      table.revisionNumber,
    ),
    // Required parent key for ownership-enforcing pointer and item foreign keys.
    uniqueIndex("branding_revisions_branding_id_id_unique").on(table.brandingId, table.id),
    index("branding_revisions_branding_status_idx").on(table.brandingId, table.status),
  ],
);

export const brandingRevisionLocalizations = mysqlTable(
  "branding_revision_localizations",
  {
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    siteName: varchar("site_name", { length: 255 }).notNull(),
    tagline: varchar("tagline", { length: 500 }),
    footerText: text("footer_text"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.revisionId, table.locale] }),
    foreignKey({
      name: "branding_revision_localizations_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [brandingRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const brandingRevisionPointers = mysqlTable(
  "branding_revision_pointers",
  {
    brandingId: id("branding_id").primaryKey(),
    draftRevisionId: id("draft_revision_id"),
    publishedRevisionId: id("published_revision_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: "branding_revision_pointers_branding_fk",
      columns: [table.brandingId],
      foreignColumns: [siteBranding.id],
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      name: "branding_revision_pointers_draft_fk",
      columns: [table.brandingId, table.draftRevisionId],
      foreignColumns: [brandingRevisions.brandingId, brandingRevisions.id],
    }).onDelete("restrict").onUpdate("restrict"),
    foreignKey({
      name: "branding_revision_pointers_published_fk",
      columns: [table.brandingId, table.publishedRevisionId],
      foreignColumns: [brandingRevisions.brandingId, brandingRevisions.id],
    }).onDelete("restrict").onUpdate("restrict"),
  ],
);

/** Localized, revision-scoped header/footer navigation tree. */
export const brandingNavigationItems = mysqlTable(
  "branding_navigation_items",
  {
    id: id("id").autoincrement().primaryKey(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    placement: mysqlEnum("placement", navigationPlacements).notNull(),
    itemKey: varchar("item_key", { length: 100 }).notNull(),
    parentId: id("parent_id"),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    href: varchar("href", { length: 500 }).notNull(),
    openInNewTab: boolean("open_in_new_tab").notNull().default(false),
    iconMediaId: id("icon_media_id").references(() => media.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_navigation_items_revision_key_unique").on(
      table.revisionId,
      table.locale,
      table.placement,
      table.itemKey,
    ),
    uniqueIndex("branding_navigation_items_revision_id_unique").on(
      table.revisionId,
      table.locale,
      table.placement,
      table.id,
    ),
    index("branding_navigation_items_revision_placement_idx").on(
      table.revisionId,
      table.locale,
      table.placement,
      table.sortOrder,
    ),
    foreignKey({
      name: "branding_navigation_items_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [brandingRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      name: "branding_navigation_items_parent_fk",
      columns: [table.revisionId, table.locale, table.placement, table.parentId],
      foreignColumns: [
        table.revisionId,
        table.locale,
        table.placement,
        table.id,
      ],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Named, revision-scoped menus are the canonical navigation sources. */
export const brandingRevisionMenus = mysqlTable(
  "branding_revision_menus",
  {
    id: id("id").autoincrement().primaryKey(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    menuKey: varchar("menu_key", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    placement: mysqlEnum("placement", navigationPlacements).notNull(),
    assignmentKey: varchar("assignment_key", { length: 100 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_revision_menus_revision_key_unique").on(table.revisionId, table.locale, table.menuKey),
    uniqueIndex("branding_revision_menus_revision_id_unique").on(table.revisionId, table.locale, table.id),
    index("branding_revision_menus_revision_placement_idx").on(table.revisionId, table.locale, table.placement),
    index("branding_revision_menus_assignment_idx").on(table.revisionId, table.locale, table.assignmentKey),
    foreignKey({
      name: "branding_revision_menus_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [brandingRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const brandingRevisionMenuItems = mysqlTable(
  "branding_revision_menu_items",
  {
    id: id("id").autoincrement().primaryKey(),
    menuId: id("menu_id").notNull(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    itemKey: varchar("item_key", { length: 100 }).notNull(),
    parentId: id("parent_id"),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    href: varchar("href", { length: 500 }).notNull(),
    visible: boolean("visible").notNull().default(true),
    target: mysqlEnum("target", navigationTargets).notNull().default("_self"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_revision_menu_items_menu_key_unique").on(table.menuId, table.itemKey),
    uniqueIndex("branding_revision_menu_items_menu_order_unique").on(table.menuId, table.sortOrder),
    uniqueIndex("branding_revision_menu_items_menu_id_unique").on(table.menuId, table.id),
    index("branding_revision_menu_items_revision_locale_idx").on(table.revisionId, table.locale),
    foreignKey({
      name: "branding_revision_menu_items_menu_fk",
      columns: [table.revisionId, table.locale, table.menuId],
      foreignColumns: [brandingRevisionMenus.revisionId, brandingRevisionMenus.locale, brandingRevisionMenus.id],
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      name: "branding_revision_menu_items_parent_fk",
      columns: [table.menuId, table.parentId],
      foreignColumns: [table.menuId, table.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);


export const footerBlockTypes = [
  "link_group",
  "text",
  "contact",
  "social_links",
] as const;

/** One localized footer layout per branding revision and locale. */
export const brandingFooterLayouts = mysqlTable(
  "branding_footer_layouts",
  {
    id: id("id").autoincrement().primaryKey(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_footer_layouts_revision_locale_unique").on(table.revisionId, table.locale),
    uniqueIndex("branding_footer_layouts_revision_locale_id_unique").on(
      table.revisionId,
      table.locale,
      table.id,
    ),
    foreignKey({
      name: "branding_footer_layouts_revision_fk",
      columns: [table.revisionId],
      foreignColumns: [brandingRevisions.id],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

/** Localized columns keep presentation order and headings separate from block content. */
export const brandingFooterColumns = mysqlTable(
  "branding_footer_columns",
  {
    id: id("id").autoincrement().primaryKey(),
    layoutId: id("layout_id").notNull(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    columnKey: varchar("column_key", { length: 100 }).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    heading: varchar("heading", { length: 255 }),
    /** Optional canonical menu assignment; legacy footer blocks remain readable. */
    assignedMenuKey: varchar("assigned_menu_key", { length: 100 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_footer_columns_layout_key_unique").on(
      table.layoutId,
      table.columnKey,
    ),
    uniqueIndex("branding_footer_columns_layout_order_unique").on(
      table.layoutId,
      table.sortOrder,
    ),
    uniqueIndex("branding_footer_columns_layout_revision_locale_id_unique").on(
      table.layoutId,
      table.revisionId,
      table.locale,
      table.id,
    ),
    index("branding_footer_columns_revision_locale_idx").on(table.revisionId, table.locale),
    foreignKey({
      name: "branding_footer_columns_layout_fk",
      columns: [table.revisionId, table.locale, table.layoutId],
      foreignColumns: [
        brandingFooterLayouts.revisionId,
        brandingFooterLayouts.locale,
        brandingFooterLayouts.id,
      ],
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      name: "branding_footer_columns_menu_fk",
      columns: [table.revisionId, table.locale, table.assignedMenuKey],
      foreignColumns: [brandingRevisionMenus.revisionId, brandingRevisionMenus.locale, brandingRevisionMenus.menuKey],
    }).onDelete("restrict").onUpdate("cascade"),
  ],
);

/** Allowlisted, localized footer blocks. contentJson is structured data, never executable HTML. */
export const brandingFooterBlocks = mysqlTable(
  "branding_footer_blocks",
  {
    id: id("id").autoincrement().primaryKey(),
    columnId: id("column_id").notNull(),
    layoutId: id("layout_id").notNull(),
    revisionId: id("revision_id").notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    blockKey: varchar("block_key", { length: 100 }).notNull(),
    blockType: mysqlEnum("block_type", footerBlockTypes).notNull(),
    sortOrder: int("sort_order", { unsigned: true }).notNull(),
    contentJson: json("content_json").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("branding_footer_blocks_column_key_unique").on(table.columnId, table.blockKey),
    uniqueIndex("branding_footer_blocks_column_order_unique").on(table.columnId, table.sortOrder),
    index("branding_footer_blocks_revision_locale_type_idx").on(
      table.revisionId,
      table.locale,
      table.blockType,
    ),
    // Keep the layout-leading access path explicit for footer reads and the
    // composite ownership foreign key; the column-leading unique indexes do
    // not provide this path.
    index("branding_footer_blocks_layout_revision_locale_idx").on(
      table.layoutId,
      table.revisionId,
      table.locale,
      table.columnId,
    ),
    foreignKey({
      name: "branding_footer_blocks_column_fk",
      columns: [table.layoutId, table.revisionId, table.locale, table.columnId],
      foreignColumns: [
        brandingFooterColumns.layoutId,
        brandingFooterColumns.revisionId,
        brandingFooterColumns.locale,
        brandingFooterColumns.id,
      ],
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export const submissions = mysqlTable(
  "submissions",
  {
    id: id("id").autoincrement().primaryKey(),
    formId: id("form_id").notNull().references(() => forms.id, { onDelete: "restrict", onUpdate: "cascade" }),
    revisionId: id("revision_id").notNull().references(() => formRevisions.id, { onDelete: "restrict", onUpdate: "cascade" }),
    formKey: varchar("form_key", { length: 100 }).notNull(),
    locale: mysqlEnum("locale", locales).notNull(),
    payloadJson: json("payload_json").notNull(),
    status: mysqlEnum("status", submissionStatuses).notNull().default("new"),
    idempotencyToken: varchar("idempotency_token", { length: 128 }).notNull(),
    metadataJson: json("metadata_json").notNull(),
    notificationStatus: mysqlEnum("notification_status", submissionNotificationStatuses).notNull().default("pending"),
    notificationError: text("notification_error"),
    notifiedAt: timestamp("notified_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("submissions_idempotency_unique").on(table.formId, table.idempotencyToken),
    index("submissions_form_status_created_idx").on(table.formKey, table.status, table.createdAt),
    index("submissions_revision_idx").on(table.revisionId),
  ],
);

export const submissionAttachments = mysqlTable(
  "submission_attachments",
  {
    id: id("id").autoincrement().primaryKey(),
    submissionId: id("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number", unsigned: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("submission_attachments_storage_unique").on(table.storageKey), index("submission_attachments_submission_idx").on(table.submissionId)],
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

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormRevision = typeof formRevisions.$inferSelect;
export type NewFormRevision = typeof formRevisions.$inferInsert;
export type FormRevisionField = typeof formRevisionFields.$inferSelect;
export type NewFormRevisionField = typeof formRevisionFields.$inferInsert;
export type FormFieldLocalization = typeof formFieldLocalizations.$inferSelect;
export type FormFieldOption = typeof formFieldOptions.$inferSelect;
export type FormFieldOptionLocalization = typeof formFieldOptionLocalizations.$inferSelect;
export type FormRevisionCopy = typeof formRevisionCopy.$inferSelect;
export type FormRevisionPointers = typeof formRevisionPointers.$inferSelect;
export type NewFormRevisionPointers = typeof formRevisionPointers.$inferInsert;
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
export type Submission = typeof submissions.$inferSelect;
export type SubmissionAttachment = typeof submissionAttachments.$inferSelect;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type SiteBranding = typeof siteBranding.$inferSelect;
export type NewSiteBranding = typeof siteBranding.$inferInsert;
export type BrandingRevision = typeof brandingRevisions.$inferSelect;
export type NewBrandingRevision = typeof brandingRevisions.$inferInsert;
export type BrandingRevisionLocalization = typeof brandingRevisionLocalizations.$inferSelect;
export type NewBrandingRevisionLocalization = typeof brandingRevisionLocalizations.$inferInsert;
export type BrandingRevisionPointers = typeof brandingRevisionPointers.$inferSelect;
export type NewBrandingRevisionPointers = typeof brandingRevisionPointers.$inferInsert;
export type BrandingNavigationItem = typeof brandingNavigationItems.$inferSelect;
export type NewBrandingNavigationItem = typeof brandingNavigationItems.$inferInsert;
export type BrandingRevisionMenu = typeof brandingRevisionMenus.$inferSelect;
export type NewBrandingRevisionMenu = typeof brandingRevisionMenus.$inferInsert;
export type BrandingRevisionMenuItem = typeof brandingRevisionMenuItems.$inferSelect;
export type NewBrandingRevisionMenuItem = typeof brandingRevisionMenuItems.$inferInsert;
export type BrandingFooterLayout = typeof brandingFooterLayouts.$inferSelect;
export type NewBrandingFooterLayout = typeof brandingFooterLayouts.$inferInsert;
export type BrandingFooterColumn = typeof brandingFooterColumns.$inferSelect;
export type NewBrandingFooterColumn = typeof brandingFooterColumns.$inferInsert;
export type BrandingFooterBlock = typeof brandingFooterBlocks.$inferSelect;
export type NewBrandingFooterBlock = typeof brandingFooterBlocks.$inferInsert;
