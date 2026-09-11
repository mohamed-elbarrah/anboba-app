/* Normalize legacy footer contact items without reintroducing geographic/map data. */
UPDATE `branding_footer_blocks`
SET `content_json` = CAST(
  REPLACE(
    REPLACE(
      REPLACE(CAST(`content_json` AS CHAR), '"kind":"location"', '"kind":"address"'),
      '"kind": "location"', '"kind": "address"'
    ),
    '"kind":  "location"', '"kind":  "address"'
  ) AS JSON
)
WHERE `block_type` = 'contact'
  AND JSON_SEARCH(`content_json`, 'one', 'location', NULL, '$.items[*].kind') IS NOT NULL;--> statement-breakpoint
/* Any contact block that is not the complete three-item contract remains
   private/unrendered until an administrator repairs it. */
