'use server';

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/connection";
import { policyDocuments, policyRevisionPointers, policyRevisions } from "@/db/schema";
import { getCurrentAdmin } from "@/features/auth/session";
import { policyInputSchema, type PolicyInput } from "./content-schema";

export type PolicyActionResult = { ok: true; id: string; revisionToken: string } | { ok: false; code: string; message: string };
const invalid = { ok: false, code: "INVALID_INPUT", message: "Invalid policy content" } as const;
const auth = { ok: false, code: "AUTH_REQUIRED", message: "Authentication is required" } as const;

function revalidatePolicy(locale: "ar" | "en", slug: string) {
  revalidatePath(`/${locale}/policies`);
  revalidatePath(`/${locale}/policies/${slug}`);
}

export async function savePolicyDraft(input: PolicyInput): Promise<PolicyActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return auth;
  const parsed = policyInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const value = parsed.data;
  try {
    const result = await getDb().transaction(async (tx) => {
      let document;
      if (value.id) {
        document = (await tx.select().from(policyDocuments).where(eq(policyDocuments.id, BigInt(value.id))).limit(1))[0];
        if (!document || document.locale !== value.locale) return null;
        const pointer = (await tx.select().from(policyRevisionPointers).where(eq(policyRevisionPointers.policyDocumentId, document.id)).limit(1).for("update"))[0];
        if (!pointer?.draftRevisionId || pointer.draftRevisionId.toString() !== value.revisionToken) return "stale" as const;
        await tx.update(policyRevisions).set({ status: "archived" }).where(eq(policyRevisions.id, pointer.draftRevisionId));
        const number = Number((await tx.select({ value: max(policyRevisions.revisionNumber) }).from(policyRevisions).where(eq(policyRevisions.policyDocumentId, document.id)))[0]?.value ?? 0) + 1;
        const inserted = await tx.insert(policyRevisions).values({ policyDocumentId: document.id, revisionNumber: number, status: "draft", title: value.title, summary: value.summary, contentJson: value.content, createdBy: admin.id });
        const revisionId = BigInt(inserted[0].insertId);
        await tx.update(policyRevisionPointers).set({ draftRevisionId: revisionId }).where(eq(policyRevisionPointers.policyDocumentId, document.id));
        await tx.update(policyDocuments).set({ slug: value.slug }).where(eq(policyDocuments.id, document.id));
        return { id: document.id.toString(), revisionToken: revisionId.toString(), slug: value.slug, locale: value.locale };
      }
      const existing = (await tx.select().from(policyDocuments).where(and(eq(policyDocuments.locale, value.locale), eq(policyDocuments.slug, value.slug))).limit(1))[0];
      if (existing) return "duplicate" as const;
      const insertedDocument = await tx.insert(policyDocuments).values({ locale: value.locale, slug: value.slug });
      const id = BigInt(insertedDocument[0].insertId);
      const insertedRevision = await tx.insert(policyRevisions).values({ policyDocumentId: id, revisionNumber: 1, status: "draft", title: value.title, summary: value.summary, contentJson: value.content, createdBy: admin.id });
      const revisionId = BigInt(insertedRevision[0].insertId);
      await tx.insert(policyRevisionPointers).values({ policyDocumentId: id, draftRevisionId: revisionId, publishedRevisionId: null });
      return { id: id.toString(), revisionToken: revisionId.toString(), slug: value.slug, locale: value.locale };
    });
    if (result === "stale") return { ok: false, code: "STALE_REVISION", message: "This policy was changed elsewhere" };
    if (result === "duplicate") return { ok: false, code: "DUPLICATE_SLUG", message: "This slug already exists for the selected language" };
    if (!result) return { ok: false, code: "NOT_FOUND", message: "Policy not found" };
    revalidatePolicy(result.locale, result.slug);
    return { ok: true, id: result.id, revisionToken: result.revisionToken };
  } catch (error) { console.error("[policies:save-draft]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to save policy" }; }
}

export async function publishPolicy(input: PolicyInput): Promise<PolicyActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return auth;
  const parsed = policyInputSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id || !parsed.data.revisionToken) return invalid;
  const value = parsed.data;
  try {
    const result = await getDb().transaction(async (tx) => {
      const document = (await tx.select().from(policyDocuments).where(and(eq(policyDocuments.id, BigInt(value.id!)), eq(policyDocuments.locale, value.locale))).limit(1))[0];
      if (!document) return null;
      const pointer = (await tx.select().from(policyRevisionPointers).where(eq(policyRevisionPointers.policyDocumentId, document.id)).limit(1).for("update"))[0];
      if (!pointer?.draftRevisionId || pointer.draftRevisionId.toString() !== value.revisionToken) return "stale" as const;
      const current = (await tx.select().from(policyRevisions).where(and(eq(policyRevisions.id, pointer.draftRevisionId), eq(policyRevisions.status, "draft"))).limit(1))[0];
      if (!current) return null;
      const number = Number((await tx.select({ value: max(policyRevisions.revisionNumber) }).from(policyRevisions).where(eq(policyRevisions.policyDocumentId, document.id)))[0]?.value ?? 0) + 1;
      if (pointer.publishedRevisionId) await tx.update(policyRevisions).set({ status: "archived" }).where(eq(policyRevisions.id, pointer.publishedRevisionId));
      await tx.update(policyRevisions).set({ status: "archived" }).where(eq(policyRevisions.id, current.id));
      const published = await tx.insert(policyRevisions).values({ policyDocumentId: document.id, revisionNumber: number, status: "published", title: value.title, summary: value.summary, contentJson: value.content, createdBy: admin.id });
      const publishedId = BigInt(published[0].insertId);
      const draft = await tx.insert(policyRevisions).values({ policyDocumentId: document.id, revisionNumber: number + 1, status: "draft", title: value.title, summary: value.summary, contentJson: value.content, createdBy: admin.id });
      const draftId = BigInt(draft[0].insertId);
      await tx.update(policyRevisionPointers).set({ publishedRevisionId: publishedId, draftRevisionId: draftId }).where(eq(policyRevisionPointers.policyDocumentId, document.id));
      await tx.update(policyDocuments).set({ slug: value.slug }).where(eq(policyDocuments.id, document.id));
      return { id: document.id.toString(), revisionToken: draftId.toString(), slug: value.slug, locale: value.locale };
    });
    if (result === "stale") return { ok: false, code: "STALE_REVISION", message: "This policy was changed elsewhere" };
    if (!result) return { ok: false, code: "NOT_FOUND", message: "Policy not found" };
    revalidatePolicy(result.locale, result.slug);
    return { ok: true, id: result.id, revisionToken: result.revisionToken };
  } catch (error) { console.error("[policies:publish]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to publish policy" }; }
}

export async function archivePolicy(id: string): Promise<PolicyActionResult> {
  if (!(await getCurrentAdmin())) return auth;
  if (!/^[1-9]\d*$/.test(id)) return invalid;
  try { const document = (await getDb().select().from(policyDocuments).where(eq(policyDocuments.id, BigInt(id))).limit(1))[0]; if (!document) return { ok: false, code: "NOT_FOUND", message: "Policy not found" }; await getDb().update(policyDocuments).set({ archivedAt: new Date() }).where(eq(policyDocuments.id, document.id)); revalidatePolicy(document.locale, document.slug); return { ok: true, id, revisionToken: "0" }; } catch (error) { console.error("[policies:archive]", error); return { ok: false, code: "INTERNAL_ERROR", message: "Unable to delete policy" }; }
}
