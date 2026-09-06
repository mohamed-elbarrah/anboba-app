import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { drizzle } from "drizzle-orm/mysql2";
import { asc, eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { closePool, getPool } from "../db/connection";
import { acquireDataLock, releaseDataLock } from "./advisory-lock";
import { forms, formRevisions } from "../db/schema";
import { parseFormConfig } from "../features/forms/registry-core";
import { normalizedFromConfig } from "../features/forms/normalized";
import { readNormalizedRevision } from "../features/forms/repository";

function canonical(value: unknown): unknown { if (typeof value === "bigint") return String(value); if (Array.isArray(value)) return value.map(canonical); if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value as object).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])); return value; }
function sameJson(left: unknown, right: unknown) { return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right)); }

async function verify() {
  const connection = await getPool().getConnection();
  const db = drizzle(connection, { schema, mode: "default" });
  let locked = false;
  try {
    await acquireDataLock(connection); locked = true;
    const failures: string[] = [];
    const rows = await db.select().from(forms).where(eq(forms.archived, false));
    let checked = 0;
    for (const form of rows) {
      const revisions = await db.select().from(formRevisions).where(eq(formRevisions.formId, form.id)).orderBy(asc(formRevisions.id));
      for (const revision of revisions) {
        checked++;
        try {
          const key = form.rendererKey;
          const normalized = await readNormalizedRevision(revision, key, db);
          // Flexible revisions persist the normalized contract directly; only
          // legacy revisions have a renderer-specific config to parse/project.
          const parsed = revision.rendererMode === "flexible" ? revision.configJson : parseFormConfig(key, revision.configJson);
          const expected = normalizedFromConfig(key, parsed, revision.locale);
          if (!sameJson(normalized, { ...expected, legacyConfig: normalized.legacyConfig })) failures.push(`projection mismatch revision=${revision.id}`);
          if (key !== "generic" && revision.rendererMode === "legacy" && (!normalized.legacyConfig || !sameJson(normalized.legacyConfig, parsed))) failures.push(`built-in legacy mismatch revision=${revision.id}`);
        } catch (error) { failures.push(`revision=${revision.id}: ${String(error)}`); }
      }
    }
    const [wrongFieldLocales] = await connection.query("SELECT l.field_id AS id FROM form_field_localizations l JOIN form_revision_fields f ON f.id=l.field_id AND f.revision_id=l.revision_id WHERE l.locale <> (SELECT r.locale FROM form_revisions r WHERE r.id=f.revision_id) LIMIT 10");
    const [wrongOptionLocales] = await connection.query("SELECT l.option_id AS id FROM form_field_option_localizations l JOIN form_field_options o ON o.id=l.option_id AND o.field_id=l.field_id JOIN form_revision_fields f ON f.id=o.field_id JOIN form_revisions r ON r.id=f.revision_id WHERE l.locale <> r.locale LIMIT 10");
    const [orphanLocs] = await connection.query("SELECT l.field_id AS id FROM form_field_localizations l LEFT JOIN form_revision_fields f ON f.id=l.field_id AND f.revision_id=l.revision_id WHERE f.id IS NULL LIMIT 10");
    const [orphanOptions] = await connection.query("SELECT o.id FROM form_field_options o LEFT JOIN form_revision_fields f ON f.id=o.field_id WHERE f.id IS NULL LIMIT 10");
    const [orphanOptionLocs] = await connection.query("SELECT l.option_id AS id FROM form_field_option_localizations l LEFT JOIN form_field_options o ON o.id=l.option_id AND o.field_id=l.field_id WHERE o.id IS NULL LIMIT 10");
    const [orphanCopies] = await connection.query("SELECT c.revision_id AS id FROM form_revision_copy c LEFT JOIN form_revisions r ON r.id=c.revision_id WHERE r.id IS NULL LIMIT 10");
    for (const [label, result] of [["field localizations", orphanLocs], ["field options", orphanOptions], ["option localizations", orphanOptionLocs], ["revision copies", orphanCopies], ["wrong field localization locales", wrongFieldLocales], ["wrong option localization locales", wrongOptionLocales]] as const) {
      if ((result as unknown[]).length) failures.push(`orphan ${label}: ${(result as unknown[]).length} (sampled)`);
    }
    if (failures.length) throw new Error(`Normalized invariant failures (${failures.length}/${checked} revisions):\n- ${failures.join("\n- ")}`);
    console.log(`[forms-normalized-verify] verified=${checked} activeForms=${rows.length} failures=0`);
  } finally { if (locked) await releaseDataLock(connection); connection.release(); }
}
verify().catch((error) => { console.error("[forms-normalized-verify] failed", error); process.exitCode = 1; }).finally(() => closePool());
