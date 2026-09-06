-- SAFETY: Reviewed additive compatibility migration for the already-applied 0002/0003 state.
-- SAFETY: This changes only the enum definition; it does not rewrite or backfill rows.
-- SAFETY: Take/verify a backup and run the read-only preflight before applying.
-- SAFETY: Apply this file once, in sequence, as 0004; do not edit __drizzle_migrations.
ALTER TABLE `form_revision_fields` MODIFY COLUMN `field_type` enum('text','email','phone','textarea','select','radio','checkbox','number','date','file') NOT NULL;