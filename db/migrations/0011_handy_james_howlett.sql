CREATE TABLE `branding_navigation_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`placement` enum('header','footer') NOT NULL,
	`item_key` varchar(100) NOT NULL,
	`parent_id` bigint unsigned,
	`sort_order` int unsigned NOT NULL,
	`label` varchar(255) NOT NULL,
	`href` varchar(500) NOT NULL,
	`open_in_new_tab` boolean NOT NULL DEFAULT false,
	`icon_media_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_navigation_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_navigation_items_revision_key_unique` UNIQUE(`revision_id`,`locale`,`placement`,`item_key`),
	CONSTRAINT `branding_navigation_items_revision_id_unique` UNIQUE(`revision_id`,`locale`,`placement`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `branding_revision_localizations` (
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`site_name` varchar(255) NOT NULL,
	`tagline` varchar(500),
	`footer_text` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_revision_localizations_revision_id_locale_pk` PRIMARY KEY(`revision_id`,`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `branding_revision_pointers` (
	`branding_id` bigint unsigned NOT NULL,
	`draft_revision_id` bigint unsigned,
	`published_revision_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_revision_pointers_branding_id` PRIMARY KEY(`branding_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `branding_revisions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`branding_id` bigint unsigned NOT NULL,
	`revision_number` int unsigned NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`logo_media_id` bigint unsigned,
	`dark_logo_media_id` bigint unsigned,
	`favicon_media_id` bigint unsigned,
	`created_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_revisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_revisions_branding_number_unique` UNIQUE(`branding_id`,`revision_number`),
	CONSTRAINT `branding_revisions_branding_id_id_unique` UNIQUE(`branding_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `site_branding` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`branding_key` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_branding_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_branding_key_unique` UNIQUE(`branding_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `branding_navigation_items` ADD CONSTRAINT `branding_navigation_items_icon_media_id_media_id_fk` FOREIGN KEY (`icon_media_id`) REFERENCES `media`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_navigation_items` ADD CONSTRAINT `branding_navigation_items_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `branding_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_navigation_items` ADD CONSTRAINT `branding_navigation_items_parent_fk` FOREIGN KEY (`revision_id`,`locale`,`placement`,`parent_id`) REFERENCES `branding_navigation_items`(`revision_id`,`locale`,`placement`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revision_localizations` ADD CONSTRAINT `branding_revision_localizations_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `branding_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revision_pointers` ADD CONSTRAINT `branding_revision_pointers_branding_fk` FOREIGN KEY (`branding_id`) REFERENCES `site_branding`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revision_pointers` ADD CONSTRAINT `branding_revision_pointers_draft_fk` FOREIGN KEY (`branding_id`,`draft_revision_id`) REFERENCES `branding_revisions`(`branding_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branding_revision_pointers` ADD CONSTRAINT `branding_revision_pointers_published_fk` FOREIGN KEY (`branding_id`,`published_revision_id`) REFERENCES `branding_revisions`(`branding_id`,`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branding_revisions` ADD CONSTRAINT `branding_revisions_branding_id_site_branding_id_fk` FOREIGN KEY (`branding_id`) REFERENCES `site_branding`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revisions` ADD CONSTRAINT `branding_revisions_logo_media_id_media_id_fk` FOREIGN KEY (`logo_media_id`) REFERENCES `media`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revisions` ADD CONSTRAINT `branding_revisions_dark_logo_media_id_media_id_fk` FOREIGN KEY (`dark_logo_media_id`) REFERENCES `media`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revisions` ADD CONSTRAINT `branding_revisions_favicon_media_id_media_id_fk` FOREIGN KEY (`favicon_media_id`) REFERENCES `media`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revisions` ADD CONSTRAINT `branding_revisions_created_by_admins_id_fk` FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `branding_navigation_items_revision_placement_idx` ON `branding_navigation_items` (`revision_id`,`locale`,`placement`,`sort_order`);--> statement-breakpoint
CREATE INDEX `branding_revisions_branding_status_idx` ON `branding_revisions` (`branding_id`,`status`);