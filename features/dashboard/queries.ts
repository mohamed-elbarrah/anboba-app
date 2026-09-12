import "server-only";

import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { media, pageRevisionPointers, pages, submissions } from "@/db/schema";
import { getFormInventory } from "@/features/forms/queries";
import { getCurrentAdmin } from "@/features/auth/session";

export type DashboardOverview = {
  pages: {
    total: number;
    publishedLocales: number;
    totalLocales: number;
    needsAttention: number;
  };
  forms: {
    total: number;
    publishedLocales: number;
    totalLocales: number;
    needsAttention: number;
  };
  submissions: {
    total: number;
    newCount: number;
    failedNotifications: number;
  };
  media: {
    total: number;
  };
};

/**
 * Loads only dashboard-safe summary data. Submission payloads and attachments
 * deliberately never cross this boundary.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (!(await getCurrentAdmin())) throw new Error("Unauthorized");

  const db = getDb();
  const [pageRows, formInventory, submissionTotalRows, newSubmissionRows, failedNotificationRows, mediaTotalRows] = await Promise.all([
    db.select({ slug: pages.slug, locale: pages.locale, publishedRevisionId: pageRevisionPointers.publishedRevisionId })
      .from(pages)
      .leftJoin(pageRevisionPointers, eq(pageRevisionPointers.pageId, pages.id)),
    getFormInventory(),
    db.select({ value: count() }).from(submissions),
    db.select({ value: count() }).from(submissions).where(eq(submissions.status, "new")),
    db.select({ value: count() }).from(submissions).where(eq(submissions.notificationStatus, "failed")),
    db.select({ value: count() }).from(media),
  ]);

  const pageIdentities = new Set(pageRows.map((row) => row.slug));
  const pagePublishedLocales = pageRows.filter((row) => row.publishedRevisionId !== null).length;
  const formPublishedLocales = formInventory.reduce((total, form) => total +
    (form.locales.ar.published === "published" ? 1 : 0) +
    (form.locales.en.published === "published" ? 1 : 0), 0);
  const totalLocales = pageIdentities.size * 2;
  const formTotalLocales = formInventory.length * 2;

  return {
    pages: {
      total: pageIdentities.size,
      publishedLocales: pagePublishedLocales,
      totalLocales,
      needsAttention: Math.max(totalLocales - pagePublishedLocales, 0),
    },
    forms: {
      total: formInventory.length,
      publishedLocales: formPublishedLocales,
      totalLocales: formTotalLocales,
      needsAttention: Math.max(formTotalLocales - formPublishedLocales, 0),
    },
    submissions: {
      total: submissionTotalRows[0]?.value ?? 0,
      newCount: newSubmissionRows[0]?.value ?? 0,
      failedNotifications: failedNotificationRows[0]?.value ?? 0,
    },
    media: {
      total: mediaTotalRows[0]?.value ?? 0,
    },
  };
}
