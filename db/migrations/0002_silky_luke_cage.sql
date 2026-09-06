CREATE TABLE `form_field_localizations` (
	`field_id` bigint unsigned NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`label` varchar(255) NOT NULL,
	`placeholder` varchar(255),
	`help_text` text,
	`validation_message` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_field_localizations_field_id_locale_pk` PRIMARY KEY(`field_id`,`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `form_field_option_localizations` (
	`option_id` bigint unsigned NOT NULL,
	`field_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`label` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_field_option_localizations_option_id_locale_pk` PRIMARY KEY(`option_id`,`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `form_field_options` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`field_id` bigint unsigned NOT NULL,
	`option_key` varchar(100) NOT NULL,
	`sort_order` int unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_field_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_field_options_field_key_unique` UNIQUE(`field_id`,`option_key`),
	CONSTRAINT `form_field_options_field_order_unique` UNIQUE(`field_id`,`sort_order`),
	CONSTRAINT `form_field_options_field_id_unique` UNIQUE(`field_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `form_revision_copy` (
	`revision_id` bigint unsigned NOT NULL,
	`submit_label` varchar(255),
	`success_message` text,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_revision_copy_revision_id` PRIMARY KEY(`revision_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `form_revision_fields` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`field_type` enum('text','email','phone','textarea','select','radio','checkbox','number','date') NOT NULL,
	`sort_order` int unsigned NOT NULL,
	`required` boolean NOT NULL DEFAULT false,
	`validation_preset` varchar(80),
	`width` enum('full','half','third') NOT NULL DEFAULT 'full',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_revision_fields_id` PRIMARY KEY(`id`),
	CONSTRAINT `form_revision_fields_revision_key_unique` UNIQUE(`revision_id`,`field_key`),
	CONSTRAINT `form_revision_fields_revision_order_unique` UNIQUE(`revision_id`,`sort_order`),
	CONSTRAINT `form_revision_fields_revision_id_unique` UNIQUE(`revision_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `form_revisions` ADD `renderer_mode` enum('legacy','flexible');--> statement-breakpoint
ALTER TABLE `form_revisions` ADD `template_key` varchar(100);--> statement-breakpoint
ALTER TABLE `form_field_localizations` ADD CONSTRAINT `form_field_localizations_field_fk` FOREIGN KEY (`revision_id`,`field_id`) REFERENCES `form_revision_fields`(`revision_id`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `form_field_option_localizations` ADD CONSTRAINT `form_field_option_localizations_option_fk` FOREIGN KEY (`field_id`,`option_id`) REFERENCES `form_field_options`(`field_id`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `form_field_options` ADD CONSTRAINT `form_field_options_field_fk` FOREIGN KEY (`field_id`) REFERENCES `form_revision_fields`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `form_revision_copy` ADD CONSTRAINT `form_revision_copy_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `form_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `form_revision_fields` ADD CONSTRAINT `form_revision_fields_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `form_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `form_field_localizations_revision_locale_idx` ON `form_field_localizations` (`revision_id`,`locale`);--> statement-breakpoint
CREATE INDEX `form_field_option_localizations_field_locale_idx` ON `form_field_option_localizations` (`field_id`,`locale`);