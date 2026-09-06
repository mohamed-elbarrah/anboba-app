CREATE TABLE `media` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`public_path` varchar(500) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`kind` enum('image','video') NOT NULL,
	`size_bytes` bigint unsigned NOT NULL,
	`uploaded_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_storage_key_unique` UNIQUE(`storage_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_uploaded_by_admins_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `admins`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `media_kind_created_idx` ON `media` (`kind`,`created_at`);--> statement-breakpoint
CREATE INDEX `media_uploaded_by_idx` ON `media` (`uploaded_by`);