CREATE TABLE `branding_footer_blocks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`column_id` bigint unsigned NOT NULL,
	`layout_id` bigint unsigned NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`block_key` varchar(100) NOT NULL,
	`block_type` enum('link_group','text','contact','map','social_links') NOT NULL,
	`sort_order` int unsigned NOT NULL,
	`content_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_footer_blocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_footer_blocks_column_key_unique` UNIQUE(`column_id`,`block_key`),
	CONSTRAINT `branding_footer_blocks_column_order_unique` UNIQUE(`column_id`,`sort_order`)
);
--> statement-breakpoint
CREATE TABLE `branding_footer_columns` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`layout_id` bigint unsigned NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`column_key` varchar(100) NOT NULL,
	`sort_order` int unsigned NOT NULL,
	`heading` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_footer_columns_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_footer_columns_layout_key_unique` UNIQUE(`layout_id`,`column_key`),
	CONSTRAINT `branding_footer_columns_layout_order_unique` UNIQUE(`layout_id`,`sort_order`),
	CONSTRAINT `branding_footer_columns_layout_revision_locale_id_unique` UNIQUE(`layout_id`,`revision_id`,`locale`,`id`)
);
--> statement-breakpoint
CREATE TABLE `branding_footer_layouts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_footer_layouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_footer_layouts_revision_locale_unique` UNIQUE(`revision_id`,`locale`),
	CONSTRAINT `branding_footer_layouts_revision_locale_id_unique` UNIQUE(`revision_id`,`locale`,`id`)
);
--> statement-breakpoint
ALTER TABLE `branding_footer_blocks` ADD CONSTRAINT `branding_footer_blocks_column_fk` FOREIGN KEY (`layout_id`,`revision_id`,`locale`,`column_id`) REFERENCES `branding_footer_columns`(`layout_id`,`revision_id`,`locale`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_footer_columns` ADD CONSTRAINT `branding_footer_columns_layout_fk` FOREIGN KEY (`revision_id`,`locale`,`layout_id`) REFERENCES `branding_footer_layouts`(`revision_id`,`locale`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_footer_layouts` ADD CONSTRAINT `branding_footer_layouts_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `branding_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `branding_footer_blocks_revision_locale_type_idx` ON `branding_footer_blocks` (`revision_id`,`locale`,`block_type`);--> statement-breakpoint
CREATE INDEX `branding_footer_columns_revision_locale_idx` ON `branding_footer_columns` (`revision_id`,`locale`);