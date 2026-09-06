CREATE TABLE `auth_login_attempts` (
	`identifier` varchar(400) NOT NULL,
	`failures` int unsigned NOT NULL DEFAULT 0,
	`first_attempt_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`locked_until` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auth_login_attempts_identifier` PRIMARY KEY(`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE INDEX `auth_login_attempts_locked_idx` ON `auth_login_attempts` (`locked_until`);