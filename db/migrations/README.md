# MySQL migration conventions

The baseline migration uses `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` on every table. `utf8mb4_unicode_ci` is the compatible MySQL 5.7+/Hostinger collation selected for this project; it provides Unicode storage for Arabic content. Drizzle's MySQL snapshot format does not persist table engine/charset options, so the explicit clauses are kept in the applied SQL migration and must be retained when reviewing/regenerating migrations.

Before applying any migration to Hostinger: take/verify a database backup, inspect the live schema and migration history read-only, compare it with the generated SQL, and confirm the target database is the intended one. Run `pnpm db:preflight:forms-normalized -- --mode=prerequisite` before `0002`/`0003`/`0004`; it requires exactly `0000` and `0001` and does not assume normalized tables exist. Run `pnpm db:preflight:forms-normalized -- --mode=post-migration` after the normalized migrations; it requires the exact `0000`–`0004` history, no pending migration, and `file` present. Both modes are read-only and exit nonzero on identity, migration, or schema mismatch. Never run these migrations automatically from development or CI. This phase's form migrations are additive only, do not seed forms, and leave existing published page content untouched. Before any migration/backfill, run the appropriate preflight against the intended database, then review its identity/schema output and backup. The seed and normalization scripts share the connection-scoped lock `anboba:data-seed-normalization`; never run them concurrently.

## Form migration ownership and order

Apply these migrations in order; do not skip or reorder them:

1. `0001_hard_skullbuster.sql` owns the form foundation: `forms`, `form_revisions`, `form_revision_pointers`, their constraints/indexes, and the nullable `page_sections.form_id` column and foreign key.
2. `0002_silky_luke_cage.sql` requires `0001` to be recorded as applied. It owns the normalized form-field tables `form_revision_fields`, `form_field_localizations`, `form_field_options`, `form_field_option_localizations`, and `form_revision_copy`, their constraints/indexes, and the nullable compatibility columns `form_revisions.renderer_mode` and `form_revisions.template_key`.
3. `0003_wealthy_red_shift.sql` requires both `0001` and `0002` to be recorded as applied. It owns only the `form_revisions_renderer_mode_template_idx` index on `form_revisions`; it creates no table or column.
4. `0004_eager_junta.sql` requires `0000`–`0003` to be recorded as applied. It only widens `form_revision_fields.field_type` to include the protected legacy `file` value. It does not backfill rows or change application data. The live database is expected to have `0000`–`0003` applied and `0004` pending until this reviewed SQL is run.

`0002` is intentionally preserved as the historical applied artifact without `file`. Do not “fix” its SQL or edit `__drizzle_migrations`; the hash is its identity. `file` remains a protected legacy-only built-in field after `0004`, while generic actions continue to reject it.

The SQL files are the authority for the exact object names and definitions. Do not treat a later migration as permission to recreate, alter, or remove objects owned by an earlier migration.

## Form migration preflight (live DB)

Migration `0001` may establish the foundation, but before applying **`0002`, `0003`, or `0004`**, perform a fresh check against the intended live database using a read-only account:

1. Confirm the Hostinger hPanel database name/host and record `SELECT DATABASE(), VERSION()`.
2. Inspect the live migration history and confirm the required earlier migration(s) are present and applied; do not rely on a stale local history file.
3. Inspect `information_schema.tables`, `columns`, `statistics`, `table_constraints`, and `referential_constraints` for every object owned by the target migration and its prerequisites.
4. Export a full backup containing schema, rows, and routines; verify that the backup is restorable or can be inspected independently before making changes.
5. Compare the exact target SQL file with the reviewed release artifact, check for conflicting object names, and confirm no long-running writes/DDL are active.
6. Apply only the reviewed migration during a maintenance window with logging, then verify its exact tables, columns, constraints, and indexes. Do not run seed/backfill in the same operation.

`form_revisions.renderer_mode` and `form_revisions.template_key` must remain nullable when `0002` is applied; they are compatibility columns and must not classify or rewrite existing rows. Verification uses canonical JSON, rejects orphan/extra/partial normalized rows, and snapshots page content JSON, page revisions, and page pointers before and after. The sole permitted page mutation is a `page_sections.form_id` reference-only repair; content and revision pointers must compare exactly.

### Backup and rollback

Keep the verified pre-migration backup and migration output until application compatibility is confirmed. Rollback is migration-specific: a reverse operation for `0003` may remove only `form_revisions_renderer_mode_template_idx`; a reverse operation for `0002` may remove only its normalized tables, constraints/indexes, and the two nullable compatibility columns; a reverse operation for `0001` may remove only its form foundation objects and `page_sections.form_id`. Never remove an object owned by another migration, and never remove `0001` objects while `0002` or `0003` remains applied or has written data. Stop incompatible application code, take a new backup, and use a separately reviewed reverse script; restore the verified backup instead when that is safer. Do not use `drizzle-kit migrate` as an ad-hoc rollback mechanism.

`page_revision_pointers` owns the optional draft and published pointers. Its composite foreign keys (`page_id`, pointer id) reference the matching `(page_id, id)` unique key on `page_revisions`, so ownership is represented in both `db/schema.ts` and the generated snapshot/migration without a cyclic `pages`/`page_revisions` declaration.

`form_revision_pointers` applies the same ownership rule with `(form_id, locale, revision_id)`, preventing a locale pointer from targeting another form or locale. `page_sections.form_id` is nullable and restrictive: references are safe to add/backfill, and deleting a referenced form cannot cascade into page content.
