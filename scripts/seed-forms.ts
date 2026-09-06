import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, max } from "drizzle-orm";
import * as schema from "../db/schema";
import { closePool, getDb, getPool } from "../db/connection";
import { formRevisionPointers, formRevisions, forms, pageRevisionPointers, pageRevisions, pageSections, pages } from "../db/schema";
import { parseFormConfig, type BuiltInFormKey, type FormRendererKey } from "../features/forms/registry-core";
import { writeNormalizedRevision } from "../features/forms/normalization";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";

const formMap: Record<BuiltInFormKey, { slug: string; section: "contact" | "join_application" | "partner_registration"; rendererKey: FormRendererKey }> = {
  contact: { slug: "contact", section: "contact", rendererKey: "contact" },
  join_application: { slug: "", section: "join_application", rendererKey: "join_application" },
  partner_registration: { slug: "join-us", section: "partner_registration", rendererKey: "partner_registration" },
};
const audit = { createdForms: 0, createdRevisions: 0, updatedSections: 0, checkedSections: 0 };
function canonical(value: unknown): unknown {
  if (typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
function sameJson(left: unknown, right: unknown) { return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right)); }
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function ensureForm(tx: Tx, key: BuiltInFormKey, rendererKey: FormRendererKey) {
  const matches = await tx.select().from(forms).where(eq(forms.formKey, key)).limit(2);
  if (matches.length > 1) throw new Error(`Built-in form key is duplicated: ${key}`);
  let form = matches[0];
  if (!form) {
    await tx.insert(forms).values({ formKey: key, rendererKey, kind: "system", archived: false });
    const created = await tx.select().from(forms).where(eq(forms.formKey, key)).limit(2);
    if (created.length !== 1) throw new Error(`Expected exactly one built-in form: ${key}`);
    form = created[0];
    audit.createdForms++;
  }
  if (form.rendererKey !== rendererKey || form.kind !== "system" || form.archived) throw new Error(`Protected form mismatch: ${key}`);
  return form;
}
async function nextNumber(tx: Tx, formId: bigint, locale: "ar" | "en") {
  const row = await tx.select({ value: max(formRevisions.revisionNumber) }).from(formRevisions).where(and(eq(formRevisions.formId, formId), eq(formRevisions.locale, locale)));
  return Number(row[0]?.value ?? 0) + 1;
}
async function makeRevision(tx: Tx, formId: bigint, locale: "ar" | "en", config: unknown, status: "published" | "draft", rendererKey: FormRendererKey) {
  const result = await tx.insert(formRevisions).values({ formId, locale, revisionNumber: await nextNumber(tx, formId, locale), status, configJson: config, rendererMode: "legacy", templateKey: rendererKey });
  const revisionId = BigInt(result[0].insertId);
  await writeNormalizedRevision(tx, revisionId, rendererKey, locale, config);
  audit.createdRevisions++;
  return revisionId;
}
async function verifyRevision(tx: Tx, id: bigint | null, formId: bigint, locale: "ar" | "en", status: "published" | "draft", rendererKey: FormRendererKey) {
  if (!id) throw new Error(`Missing ${status} form pointer for ${formId}:${locale}`);
  const row = (await tx.select().from(formRevisions).where(and(eq(formRevisions.id, id), eq(formRevisions.formId, formId), eq(formRevisions.locale, locale), eq(formRevisions.status, status))).limit(1))[0];
  if (!row) throw new Error(`Invalid ${status} form pointer for ${formId}:${locale}`);
  parseFormConfig(rendererKey, row.configJson);
  return row;
}
async function backfill() {
  // GET_LOCK is connection-scoped, so acquire it on the same dedicated
  // connection used for the transaction. Release happens only after the
  // transaction promise settles, including rollback/error paths.
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  let acquired = false;
  try {
    await acquireDataLock(connection);
    acquired = true;
    await db.transaction(async (tx) => {
      for (const [key, mapping] of Object.entries(formMap) as [BuiltInFormKey, typeof formMap[BuiltInFormKey]][]) {
        const form = await ensureForm(tx, key, mapping.rendererKey);
        for (const locale of ["ar", "en"] as const) {
          const page = (await tx.select().from(pages).where(and(eq(pages.locale, locale), eq(pages.slug, mapping.slug))).limit(1))[0];
          if (!page) throw new Error(`Missing expected source page: ${locale}:${mapping.slug || "home"}`);
          const pointer = (await tx.select().from(pageRevisionPointers).where(eq(pageRevisionPointers.pageId, page.id)).limit(1))[0];
          if (!pointer?.publishedRevisionId || !pointer.draftRevisionId) throw new Error(`Missing page pointers: ${locale}:${mapping.slug || "home"}`);
          const publishedPage = (await tx.select().from(pageRevisions).where(and(eq(pageRevisions.id, pointer.publishedRevisionId), eq(pageRevisions.pageId, page.id), eq(pageRevisions.status, "published"))).limit(1))[0];
          const draftPage = (await tx.select().from(pageRevisions).where(and(eq(pageRevisions.id, pointer.draftRevisionId), eq(pageRevisions.pageId, page.id), eq(pageRevisions.status, "draft"))).limit(1))[0];
          if (!publishedPage || !draftPage) throw new Error(`Invalid page pointers: ${locale}:${mapping.slug || "home"}`);
          const publishedSections = await tx.select().from(pageSections).where(and(eq(pageSections.revisionId, publishedPage.id), eq(pageSections.sectionKey, mapping.section)));
          const draftSections = await tx.select().from(pageSections).where(and(eq(pageSections.revisionId, draftPage.id), eq(pageSections.sectionKey, mapping.section)));
          if (publishedSections.length !== 1 || draftSections.length !== 1) throw new Error(`Expected exactly one source section: ${locale}:${mapping.section}`);
          const publishedSection = publishedSections[0];
          const draftSection = draftSections[0];
          const publishedConfig = parseFormConfig(mapping.rendererKey, publishedSection.contentJson);
          const draftConfig = parseFormConfig(mapping.rendererKey, draftSection.contentJson);
          const existing = (await tx.select().from(formRevisionPointers).where(and(eq(formRevisionPointers.formId, form.id), eq(formRevisionPointers.locale, locale))).limit(1))[0];
          if (existing) {
            const activePublished = await verifyRevision(tx, existing.publishedRevisionId, form.id, locale, "published", mapping.rendererKey);
            const activeDraft = await verifyRevision(tx, existing.draftRevisionId, form.id, locale, "draft", mapping.rendererKey);
            // Seed source is immutable. Existing active form content must be an
            // exact match before any reference repair is considered.
            if (!sameJson(activePublished.configJson, publishedConfig)) throw new Error(`Built-in form ${key} ${locale} published config differs from source page; refusing to overwrite CMS content`);
            if (!sameJson(activeDraft.configJson, draftConfig)) throw new Error(`Built-in form ${key} ${locale} draft config differs from source page; refusing to overwrite CMS content`);
          }
          const allSections = await tx.select({ id: pageSections.id, formId: pageSections.formId }).from(pageSections).innerJoin(pageRevisions, eq(pageSections.revisionId, pageRevisions.id)).where(and(eq(pageRevisions.pageId, page.id), eq(pageSections.sectionKey, mapping.section)));
          for (const section of allSections) {
            audit.checkedSections++;
            if (section.formId !== null && section.formId !== form.id) throw new Error(`Built-in section ${locale}:${mapping.section} references another form; refusing to overwrite CMS content`);
            if (section.formId === null) {
              await tx.update(pageSections).set({ formId: form.id }).where(eq(pageSections.id, section.id));
              audit.updatedSections++;
            }
          }
          if (existing) {
            // Status is lifecycle metadata, not revision content. Retire any
            // stale active rows while preserving every historical configJson.
            const revisions = await tx.select().from(formRevisions).where(and(eq(formRevisions.formId, form.id), eq(formRevisions.locale, locale)));
            for (const revision of revisions) {
              if ((revision.status === "published" && revision.id !== existing.publishedRevisionId) || (revision.status === "draft" && revision.id !== existing.draftRevisionId)) {
                await tx.update(formRevisions).set({ status: "archived" }).where(eq(formRevisions.id, revision.id));
              }
            }
          } else {
            const published = await makeRevision(tx, form.id, locale, publishedConfig, "published", mapping.rendererKey);
            const draft = await makeRevision(tx, form.id, locale, draftConfig, "draft", mapping.rendererKey);
            await tx.insert(formRevisionPointers).values({ formId: form.id, locale, publishedRevisionId: published, draftRevisionId: draft });
          }
        }
      }
    });
  } finally {
    try {
      if (acquired) await releaseDataLock(connection);
    } finally {
      connection.release();
    }
  }
  console.log(`[forms-backfill] complete createdForms=${audit.createdForms} createdRevisions=${audit.createdRevisions} updatedSections=${audit.updatedSections} checkedSections=${audit.checkedSections}`);
}
backfill().catch((error) => { console.error("[forms-backfill] failed", error); process.exitCode = 1; }).finally(() => closePool());
