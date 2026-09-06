# MySQL migration conventions

The baseline migration uses `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` on every table. `utf8mb4_unicode_ci` is the compatible MySQL 5.7+/Hostinger collation selected for this project; it provides Unicode storage for Arabic content. Drizzle's MySQL snapshot format does not persist table engine/charset options, so the explicit clauses are kept in the applied SQL migration and must be retained when reviewing/regenerating migrations.

`page_revision_pointers` owns the optional draft and published pointers. Its composite foreign keys (`page_id`, pointer id) reference the matching `(page_id, id)` unique key on `page_revisions`, so ownership is represented in both `db/schema.ts` and the generated snapshot/migration without a cyclic `pages`/`page_revisions` declaration.
