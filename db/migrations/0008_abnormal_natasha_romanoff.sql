CREATE TABLE `policy_documents` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`slug` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policy_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_documents_locale_slug_unique` UNIQUE(`locale`,`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `policy_revision_pointers` (
	`policy_document_id` bigint unsigned NOT NULL,
	`draft_revision_id` bigint unsigned,
	`published_revision_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policy_revision_pointers_policy_document_id` PRIMARY KEY(`policy_document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `policy_revisions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`policy_document_id` bigint unsigned NOT NULL,
	`revision_number` int unsigned NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`content_json` json NOT NULL,
	`created_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policy_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_revisions_document_number_unique` UNIQUE(`policy_document_id`,`revision_number`),
	CONSTRAINT `policy_revisions_document_id_id_unique` UNIQUE(`policy_document_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `policy_revision_pointers` ADD CONSTRAINT `policy_revision_pointers_document_fk` FOREIGN KEY (`policy_document_id`) REFERENCES `policy_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `policy_revision_pointers` ADD CONSTRAINT `policy_revision_pointers_draft_fk` FOREIGN KEY (`policy_document_id`,`draft_revision_id`) REFERENCES `policy_revisions`(`policy_document_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `policy_revision_pointers` ADD CONSTRAINT `policy_revision_pointers_published_fk` FOREIGN KEY (`policy_document_id`,`published_revision_id`) REFERENCES `policy_revisions`(`policy_document_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `policy_revisions` ADD CONSTRAINT `policy_revisions_policy_document_id_policy_documents_id_fk` FOREIGN KEY (`policy_document_id`) REFERENCES `policy_documents`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `policy_revisions` ADD CONSTRAINT `policy_revisions_created_by_admins_id_fk` FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `policy_revisions_document_status_idx` ON `policy_revisions` (`policy_document_id`,`status`);