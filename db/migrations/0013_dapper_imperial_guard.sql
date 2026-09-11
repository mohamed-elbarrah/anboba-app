CREATE TABLE `branding_revision_menu_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`menu_id` bigint unsigned NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`item_key` varchar(100) NOT NULL,
	`parent_id` bigint unsigned,
	`sort_order` int unsigned NOT NULL,
	`label` varchar(255) NOT NULL,
	`href` varchar(500) NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`target` enum('_self','_blank') NOT NULL DEFAULT '_self',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_revision_menu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_revision_menu_items_menu_key_unique` UNIQUE(`menu_id`,`item_key`),
	CONSTRAINT `branding_revision_menu_items_menu_order_unique` UNIQUE(`menu_id`,`sort_order`),
	CONSTRAINT `branding_revision_menu_items_menu_id_unique` UNIQUE(`menu_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `branding_revision_menus` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`revision_id` bigint unsigned NOT NULL,
	`locale` enum('ar','en') NOT NULL,
	`menu_key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`placement` enum('header','footer') NOT NULL,
	`assignment_key` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branding_revision_menus_id` PRIMARY KEY(`id`),
	CONSTRAINT `branding_revision_menus_revision_key_unique` UNIQUE(`revision_id`,`locale`,`menu_key`),
	CONSTRAINT `branding_revision_menus_revision_id_unique` UNIQUE(`revision_id`,`locale`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
ALTER TABLE `branding_footer_columns` ADD `assigned_menu_key` varchar(100);--> statement-breakpoint
ALTER TABLE `branding_revision_menu_items` ADD CONSTRAINT `branding_revision_menu_items_menu_fk` FOREIGN KEY (`revision_id`,`locale`,`menu_id`) REFERENCES `branding_revision_menus`(`revision_id`,`locale`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revision_menu_items` ADD CONSTRAINT `branding_revision_menu_items_parent_fk` FOREIGN KEY (`menu_id`,`parent_id`) REFERENCES `branding_revision_menu_items`(`menu_id`,`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `branding_revision_menus` ADD CONSTRAINT `branding_revision_menus_revision_fk` FOREIGN KEY (`revision_id`) REFERENCES `branding_revisions`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `branding_revision_menu_items_revision_locale_idx` ON `branding_revision_menu_items` (`revision_id`,`locale`);--> statement-breakpoint
CREATE INDEX `branding_revision_menus_revision_placement_idx` ON `branding_revision_menus` (`revision_id`,`locale`,`placement`);--> statement-breakpoint
CREATE INDEX `branding_revision_menus_assignment_idx` ON `branding_revision_menus` (`revision_id`,`locale`,`assignment_key`);--> statement-breakpoint
ALTER TABLE `branding_footer_columns` ADD CONSTRAINT `branding_footer_columns_menu_fk` FOREIGN KEY (`revision_id`,`locale`,`assigned_menu_key`) REFERENCES `branding_revision_menus`(`revision_id`,`locale`,`menu_key`) ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
/* Backfill canonical named menus from the legacy revision-scoped navigation rows. */
INSERT INTO `branding_revision_menus` (`revision_id`, `locale`, `menu_key`, `name`, `placement`, `assignment_key`)
SELECT `r`.`id`, `l`.`locale`, `m`.`menu_key`, m.`name`, m.`placement`, m.`assignment_key`
FROM `branding_revisions` r
JOIN `branding_revision_localizations` l ON l.`revision_id` = r.`id`
JOIN (
  SELECT 'header-primary' AS `menu_key`, 'القائمة الرئيسية' AS `name`, 'header' AS `placement`, 'header-primary' AS `assignment_key`
  UNION ALL SELECT 'header-primary', 'Primary navigation', 'header', 'header-primary'
  UNION ALL SELECT 'footer-brand', 'العلامة التجارية', 'footer', 'brand'
  UNION ALL SELECT 'footer-brand', 'Brand', 'footer', 'brand'
  UNION ALL SELECT 'footer-quick-links', 'روابط سريعة', 'footer', 'quick-links'
  UNION ALL SELECT 'footer-quick-links', 'Quick links', 'footer', 'quick-links'
  UNION ALL SELECT 'footer-contact-map', 'التواصل والموقع', 'footer', 'contact-map'
  UNION ALL SELECT 'footer-contact-map', 'Contact & map', 'footer', 'contact-map'
) m ON (m.`menu_key` = 'header-primary' AND l.`locale` = 'ar' AND m.`name` = 'القائمة الرئيسية')
    OR (m.`menu_key` = 'header-primary' AND l.`locale` = 'en' AND m.`name` = 'Primary navigation')
    OR (m.`menu_key` = 'footer-brand' AND l.`locale` = 'ar' AND m.`name` = 'العلامة التجارية')
    OR (m.`menu_key` = 'footer-brand' AND l.`locale` = 'en' AND m.`name` = 'Brand')
    OR (m.`menu_key` = 'footer-quick-links' AND l.`locale` = 'ar' AND m.`name` = 'روابط سريعة')
    OR (m.`menu_key` = 'footer-quick-links' AND l.`locale` = 'en' AND m.`name` = 'Quick links')
    OR (m.`menu_key` = 'footer-contact-map' AND l.`locale` = 'ar' AND m.`name` = 'التواصل والموقع')
    OR (m.`menu_key` = 'footer-contact-map' AND l.`locale` = 'en' AND m.`name` = 'Contact & map');
--> statement-breakpoint
INSERT INTO `branding_revision_menu_items` (`menu_id`, `revision_id`, `locale`, `item_key`, `sort_order`, `label`, `href`, `visible`, `target`)
SELECT m.`id`, n.`revision_id`, n.`locale`, n.`item_key`, n.`sort_order`, n.`label`, n.`href`, TRUE, IF(n.`open_in_new_tab`, '_blank', '_self')
FROM `branding_navigation_items` n
JOIN `branding_revision_menus` m ON m.`revision_id` = n.`revision_id` AND m.`locale` = n.`locale`
WHERE n.`placement` = 'header' AND m.`menu_key` = 'header-primary';
--> statement-breakpoint
INSERT INTO `branding_revision_menu_items` (`menu_id`, `revision_id`, `locale`, `item_key`, `sort_order`, `label`, `href`, `visible`, `target`)
SELECT m.`id`, n.`revision_id`, n.`locale`, n.`item_key`, n.`sort_order`, n.`label`, n.`href`, TRUE, IF(n.`open_in_new_tab`, '_blank', '_self')
FROM `branding_navigation_items` n
JOIN `branding_revision_menus` m ON m.`revision_id` = n.`revision_id` AND m.`locale` = n.`locale`
WHERE n.`placement` = 'footer' AND m.`menu_key` = 'footer-quick-links';
--> statement-breakpoint
/* Existing public footer columns now resolve their named menu assignment. */
UPDATE `branding_footer_columns`
SET `assigned_menu_key` = CASE `column_key`
  WHEN 'brand' THEN 'footer-brand'
  WHEN 'quick-links' THEN 'footer-quick-links'
  WHEN 'contact-map' THEN 'footer-contact-map'
  ELSE NULL
END
WHERE `column_key` IN ('brand', 'quick-links', 'contact-map');