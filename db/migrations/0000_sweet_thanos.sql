-- MySQL/InnoDB baseline. utf8mb4_unicode_ci is supported by MySQL 5.7+ and Hostinger MySQL installations.
CREATE TABLE `contact_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`subject` varchar(255),
	`message` text NOT NULL,
	`status` enum('unread','read','replied','archived') NOT NULL DEFAULT 'unread',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `page_revision_pointers` (
	`page_id` bigint unsigned NOT NULL,
	`draft_revision_id` bigint unsigned,
	`published_revision_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_revision_pointers_page_id` PRIMARY KEY(`page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `page_revisions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`page_id` bigint unsigned NOT NULL,
	`revision_number` int unsigned NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`title` varchar(255) NOT NULL,
	`meta_title` varchar(255),
	`meta_description` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_revisions_page_number_unique` UNIQUE(`page_id`,`revision_number`),
	CONSTRAINT `page_revisions_page_id_id_unique` UNIQUE(`page_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`section_key` enum('hero','service_overview','statistics','why_choose_us','service_benefits','join_application','faq_support','vision_mission','contact','partner_registration','policies') NOT NULL,
	`section_type` enum('hero','service_overview','statistics','why_choose_us','service_benefits','join_application','faq_support','vision_mission','contact','partner_registration','policies') NOT NULL,
	`sort_order` int unsigned NOT NULL,
	`content_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_sections_revision_key_unique` UNIQUE(`revision_id`,`section_key`),
	CONSTRAINT `page_sections_revision_order_unique` UNIQUE(`revision_id`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`slug` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_locale_slug_unique` UNIQUE(`locale`,`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`key` varchar(191) NOT NULL,
	`value_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `page_revision_pointers` ADD CONSTRAINT `page_revision_pointers_page_fk` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `page_revision_pointers` ADD CONSTRAINT `page_revision_pointers_draft_revision_fk` FOREIGN KEY (`page_id`,`draft_revision_id`) REFERENCES `page_revisions`(`page_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `page_revision_pointers` ADD CONSTRAINT `page_revision_pointers_published_revision_fk` FOREIGN KEY (`page_id`,`published_revision_id`) REFERENCES `page_revisions`(`page_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `page_revisions` ADD CONSTRAINT `page_revisions_page_id_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `page_sections` ADD CONSTRAINT `page_sections_revision_id_page_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `page_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `contact_messages_status_created_idx` ON `contact_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `contact_messages_email_idx` ON `contact_messages` (`email`(191));--> statement-breakpoint
CREATE INDEX `page_revisions_page_status_idx` ON `page_revisions` (`page_id`,`status`);