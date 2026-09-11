/* Retire geographic map blocks without losing their human-readable address. */
UPDATE `branding_footer_blocks`
SET
  `block_type` = 'contact',
  `content_json` = JSON_OBJECT(
    'title', JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.title')),
    'items', JSON_ARRAY(JSON_OBJECT(
      'kind', 'address',
      'label', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.label')), 'Address'),
      'value', COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.address')),
        JSON_UNQUOTE(JSON_EXTRACT(`content_json`, '$.location')),
        ''
      )
    ))
  )
WHERE `block_type` = 'map';--> statement-breakpoint
ALTER TABLE `branding_footer_blocks` MODIFY COLUMN `block_type` enum('link_group','text','contact','social_links') NOT NULL;--> statement-breakpoint
/* Keep old rows readable while removing map terminology from active seed data. */
UPDATE `branding_revision_menus` SET `menu_key` = 'footer-contact', `assignment_key` = 'contact' WHERE `menu_key` = 'footer-contact-map';--> statement-breakpoint
UPDATE `branding_footer_columns` SET `column_key` = 'contact' WHERE `column_key` = 'contact-map';--> statement-breakpoint
UPDATE `branding_footer_columns` SET `assigned_menu_key` = 'footer-contact' WHERE `assigned_menu_key` = 'footer-contact-map';
