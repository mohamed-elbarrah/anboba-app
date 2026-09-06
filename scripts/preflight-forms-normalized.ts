import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { closePool, getPool } from "../db/connection";

type Row = Record<string, string | number | null>;
type Mode = "prerequisite" | "post-migration";
const mode = (process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ?? "prerequisite") as Mode;
const migrations = ["0000_sweet_thanos.sql", "0001_hard_skullbuster.sql", "0002_silky_luke_cage.sql", "0003_wealthy_red_shift.sql", "0004_eager_junta.sql"] as const;
const baselineTables = ["contact_messages", "page_revision_pointers", "page_revisions", "page_sections", "pages", "settings"];
const foundationTables = ["forms", "form_revisions", "form_revision_pointers"];
const normalizedTables = ["form_revision_fields", "form_field_localizations", "form_field_options", "form_field_option_localizations", "form_revision_copy"];
const columns: Record<string, string[]> = {
  forms: ["id", "form_key", "renderer_key", "kind", "archived"],
  form_revisions: ["id", "form_id", "locale", "revision_number", "status", "config_json"],
  form_revision_pointers: ["form_id", "locale", "draft_revision_id", "published_revision_id"],
  form_revision_fields: ["id", "revision_id", "field_key", "field_type", "sort_order", "required", "validation_preset", "width"],
  form_field_localizations: ["field_id", "revision_id", "locale", "label"],
  form_field_options: ["id", "field_id", "option_key", "sort_order"],
  form_field_option_localizations: ["option_id", "field_id", "locale", "label"],
  form_revision_copy: ["revision_id", "submit_label", "success_message", "error_message"],
  pages: ["id", "locale", "slug"], page_revisions: ["id", "page_id"], page_revision_pointers: ["page_id", "draft_revision_id", "published_revision_id"], page_sections: ["id", "revision_id", "form_id"],
};
const indexes: Record<string, string[]> = {
  forms: ["forms_form_key_unique", "forms_renderer_archived_idx"],
  form_revisions: ["form_revisions_form_locale_number_unique", "form_revisions_form_locale_id_unique", "form_revisions_renderer_mode_template_idx"],
  form_revision_fields: ["form_revision_fields_revision_key_unique", "form_revision_fields_revision_order_unique", "form_revision_fields_revision_id_unique"],
  form_field_options: ["form_field_options_field_key_unique", "form_field_options_field_order_unique", "form_field_options_field_id_unique"],
  form_field_localizations: ["form_field_localizations_revision_locale_idx"],
  form_field_option_localizations: ["form_field_option_localizations_field_locale_idx"],
};
const constraints = ["form_revisions_form_id_forms_id_fk", "form_revision_fields_revision_fk", "form_field_localizations_field_fk", "form_field_options_field_fk", "form_field_option_localizations_option_fk", "form_revision_copy_revision_fk", "form_revision_pointers_draft_revision_fk", "form_revision_pointers_published_revision_fk", "page_sections_form_id_forms_id_fk"];

async function migrationHashes() {
  return Object.fromEntries(await Promise.all(migrations.map(async (file) => [file, createHash("sha256").update(await readFile(join(process.cwd(), "db/migrations", file))).digest("hex")]))) as Record<string, string>;
}
const compositeIndexes: Record<string, string[]> = {
  "form_field_localizations": ["field_id", "locale"],
  "form_field_option_localizations": ["option_id", "locale"],
};

async function preflight() {
  if (mode !== "prerequisite" && mode !== "post-migration") throw new Error("mode must be prerequisite or post-migration");
  const pool = getPool(); const failures: string[] = []; const hashes = await migrationHashes();
  const [[identity]] = await pool.query("SELECT DATABASE() AS databaseName, VERSION() AS version, @@default_storage_engine AS engine, @@collation_database AS databaseCollation") as [Row[], unknown];
  if (!identity) failures.push("could not read target database identity");
  const databaseName = String(identity?.databaseName ?? "");
  if (process.env.DB_NAME && databaseName !== process.env.DB_NAME) failures.push(`target database mismatch: expected ${process.env.DB_NAME}, got ${databaseName || "<none>"}`);
  if (String(identity?.engine ?? "").toLowerCase() !== "innodb") failures.push(`database default engine is ${identity?.engine ?? "<none>"}, expected InnoDB`);
  if (String(identity?.databaseCollation ?? "") !== "utf8mb4_unicode_ci") failures.push(`database collation is ${identity?.databaseCollation ?? "<none>"}, expected utf8mb4_unicode_ci`);

  let history: Row[] = [];
  try { const [rows] = await pool.query("SELECT hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at"); history = rows as Row[]; } catch { failures.push("migration history table __drizzle_migrations is not readable"); }
  const known = new Map(Object.entries(hashes).map(([file, hash]) => [hash, file]));
  const applied = new Set<string>();
  for (const [index, row] of history.entries()) { const hash = String(row.hash ?? ""); const file = known.get(hash); if (!file) failures.push(`unknown migration hash/ID ${hash}`); else { applied.add(file); if (file !== migrations[index]) failures.push(`migration history out of order at ${file}; expected ${migrations[index] ?? "no further migration"}`); } }
  const requiredHistory = mode === "prerequisite" ? migrations.slice(0, 2) : migrations;
  for (const file of requiredHistory) if (!applied.has(file)) failures.push(`migration ${file.slice(0, 4)} is not recorded`);
  if (mode === "prerequisite") for (const file of migrations.slice(2)) if (applied.has(file)) failures.push(`migration ${file.slice(0, 4)} must still be pending before normalized migrations`);
  const pending = migrations.filter((file) => !applied.has(file));

  const [tables] = await pool.query("SELECT table_name AS name, engine, table_collation AS collation FROM information_schema.tables WHERE table_schema=DATABASE()") as [Row[], unknown];
  const tableMap = new Map((tables as Row[]).map((r) => [String(r.name), r]));
  const requiredTables = mode === "prerequisite" ? [...baselineTables, ...foundationTables] : [...baselineTables, ...foundationTables, ...normalizedTables];
  for (const table of requiredTables) { const row = tableMap.get(table); if (!row) { failures.push(`missing table ${table}`); continue; } if (String(row.engine) !== "InnoDB") failures.push(`${table} engine is ${row.engine}, expected InnoDB`); if (String(row.collation) !== "utf8mb4_unicode_ci") failures.push(`${table} collation is ${row.collation}, expected utf8mb4_unicode_ci`); }
  const [columnRows] = await pool.query("SELECT table_name AS tableName, column_name AS columnName FROM information_schema.columns WHERE table_schema=DATABASE()") as [Row[], unknown];
  const columnSet = new Set((columnRows as Row[]).map((r) => `${r.tableName}.${r.columnName}`));
  for (const table of requiredTables) for (const name of columns[table] ?? []) if (!columnSet.has(`${table}.${name}`)) failures.push(`missing column ${table}.${name}`);
  const [fieldTypeRows] = await pool.query("SELECT column_type AS columnType FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='form_revision_fields' AND column_name='field_type'") as [Row[], unknown];
  const fieldType = String((fieldTypeRows as Row[])[0]?.columnType ?? "");
  const expectedFieldType = mode === "post-migration" ? "enum('text','email','phone','textarea','select','radio','checkbox','number','date','file')" : "enum('text','email','phone','textarea','select','radio','checkbox','number','date')";
  if (mode === "post-migration" && fieldType !== expectedFieldType) failures.push(`form_revision_fields.field_type is ${fieldType || "missing"}; expected ${expectedFieldType}`);
  if (mode === "post-migration") {
    const [indexRows] = await pool.query("SELECT table_name AS tableName, index_name AS indexName, column_name AS columnName, seq_in_index AS seqInIndex FROM information_schema.statistics WHERE table_schema=DATABASE()") as [Row[], unknown];
    const indexSet = new Set((indexRows as Row[]).map((r) => `${r.tableName}.${r.indexName}`));
    if (mode === "post-migration") for (const [table, names] of Object.entries(indexes)) for (const name of names) if (!indexSet.has(`${table}.${name}`)) failures.push(`missing index ${table}.${name}`);
    // MariaDB may expose a different generated name for a composite primary key.
    // Match its ordered columns rather than treating the name as migration identity.
    for (const [table, expectedColumns] of Object.entries(compositeIndexes)) {
      const candidates = (indexRows as Row[]).filter((r) => String(r.tableName) === table);
      const actual = new Map<string, string[]>();
      for (const row of candidates) {
        const name = String(row.indexName); const column = String(row.columnName ?? "");
        const list = actual.get(name) ?? []; list[Number(row.seqInIndex ?? 0) - 1] = column; actual.set(name, list);
      }
      if (![...actual.values()].some((columns) => columns.join("\\0") === expectedColumns.join("\\0"))) failures.push(`missing composite index on ${table} (${expectedColumns.join(", ")})`);
    }
    const [constraintRows] = await pool.query("SELECT constraint_name AS name FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND constraint_type IN ('FOREIGN KEY','PRIMARY KEY','UNIQUE')") as [Row[], unknown];
    const set = new Set((constraintRows as Row[]).map((r) => String(r.name))); for (const name of constraints) if (!set.has(name)) failures.push(`missing constraint ${name}`);
  }
  console.log(JSON.stringify({ mode, identity, migrationHashes: hashes, appliedMigrationIds: [...applied], pendingMigrationIds: pending, readOnly: true }, null, 2));
  if (failures.length) throw new Error(`Preflight refused (${failures.length} checks):\n- ${failures.join("\n- ")}`);
  console.log(`[forms-preflight] ${mode} checks passed; no migration or backfill was run`);
}
preflight().catch((error) => { console.error("[forms-preflight] failed", error); process.exitCode = 1; }).finally(() => closePool());
