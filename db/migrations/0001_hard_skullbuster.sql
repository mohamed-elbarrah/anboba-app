CREATE TABLE `form_revision_pointers` (
	`form_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`draft_revision_id` bigint unsigned,
	`published_revision_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_revision_pointers_form_id_locale_pk` PRIMARY KEY(`form_id`,`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `form_revisions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`form_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`revision_number` int unsigned NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`config_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_revisions_form_locale_number_unique` UNIQUE(`form_id`,`locale`,`revision_number`),
	CONSTRAINT `form_revisions_form_locale_id_unique` UNIQUE(`form_id`,`locale`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`form_key` varchar(100) NOT NULL,
	`renderer_key` enum('contact','join_application','partner_registration','generic') NOT NULL,
	`kind` enum('system','user') NOT NULL DEFAULT 'user',
	`archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `forms_form_key_unique` UNIQUE(`form_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
-- Additive only: existing page content remains unchanged; nullable references are backfilled separately.
ALTER TABLE `page_sections` ADD `form_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `form_revision_pointers` ADD CONSTRAINT `form_revision_pointers_form_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `form_revision_pointers` ADD CONSTRAINT `form_revision_pointers_draft_revision_fk` FOREIGN KEY (`form_id`,`locale`,`draft_revision_id`) REFERENCES `form_revisions`(`form_id`,`locale`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `form_revision_pointers` ADD CONSTRAINT `form_revision_pointers_published_revision_fk` FOREIGN KEY (`form_id`,`locale`,`published_revision_id`) REFERENCES `form_revisions`(`form_id`,`locale`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `form_revisions` ADD CONSTRAINT `form_revisions_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `form_revisions_form_locale_status_idx` ON `form_revisions` (`form_id`,`locale`,`status`);--> statement-breakpoint
CREATE INDEX `forms_renderer_archived_idx` ON `forms` (`renderer_key`,`archived`);--> statement-breakpoint
ALTER TABLE `page_sections` ADD CONSTRAINT `page_sections_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE restrict ON UPDATE cascade;