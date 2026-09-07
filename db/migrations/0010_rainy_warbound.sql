CREATE TABLE `submission_attachments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`submission_id` bigint unsigned NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`storage_key` varchar(255) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`size_bytes` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `submission_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `submission_attachments_storage_unique` UNIQUE(`storage_key`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`form_id` bigint unsigned NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`form_key` varchar(100) NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`payload_json` json NOT NULL,
	`status` enum('new','in_review','accepted','rejected','archived') NOT NULL DEFAULT 'new',
	`idempotency_token` varchar(128) NOT NULL,
	`metadata_json` json NOT NULL,
	`notification_status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`notification_error` text,
	`notified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_idempotency_unique` UNIQUE(`form_id`,`idempotency_token`)
);
--> statement-breakpoint
ALTER TABLE `submission_attachments` ADD CONSTRAINT `submission_attachments_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_form_id_forms_id_fk` FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_revision_id_form_revisions_id_fk` FOREIGN KEY (`revision_id`) REFERENCES `form_revisions`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `submission_attachments_submission_idx` ON `submission_attachments` (`submission_id`);--> statement-breakpoint
CREATE INDEX `submissions_form_status_created_idx` ON `submissions` (`form_key`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `submissions_revision_idx` ON `submissions` (`revision_id`);