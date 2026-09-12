# ANBOBA Headless WordPress Migration Plan

> Status: Proposed execution plan
>
> Target: Existing Next.js public frontend + WordPress as the editorial CMS
>
> Cost constraint: Fully free/open-source WordPress stack; no paid plugins
>
> Migration strategy: Page by page and section by section, with an acceptance gate after every section

## 1. Decision

ANBOBA will use WordPress as the editorial CMS for public website content while preserving the existing Next.js public frontend, routes, components, responsive behavior, Arabic RTL behavior, English LTR behavior, and visual design.

The existing custom CMS is considered **legacy during migration**:

- Do not add new CMS features to it.
- Do not refactor it as part of the WordPress integration.
- Do not couple new WordPress code to its database schema.
- Leave an unmigrated page on its current source until that page passes its WordPress acceptance gate.
- Use it only as a content reference and temporary rollback source.
- Remove it only after every page, global setting, public media item, and form-content contract has passed migration verification.

This migration is intentionally incremental. There will be no single “big bang” rewrite.

## 2. Required source-of-truth update

`REFERENCE.md` currently prohibits WordPress and declares the custom CMS as the final architecture. Before implementation code begins, update `REFERENCE.md` so it records the newly approved architecture:

```text
Next.js public frontend
├── WordPress editorial CMS
├── WordPress public media and navigation
├── Existing Next.js public forms
├── Next.js secure submission processing
├── Hostinger MySQL for operational form data
└── Private Hostinger storage for protected attachments, subject to deployment verification
```

`CMS-IMPLEMENTATION-PLAN.md` becomes historical documentation for the legacy custom CMS. It must not remain the active implementation plan after the reference update.

## 3. Non-negotiable principles

1. Preserve the existing public design. WordPress edits content, not React layout or styling.
2. Migrate one section at a time.
3. Do not start the next section until the current section passes its acceptance gate.
4. Never render arbitrary WordPress HTML, JavaScript, CSS, embeds, or shortcodes in Next.js.
5. Validate every WordPress API response in Next.js before rendering it.
6. Keep database credentials and WordPress Application Passwords server-only.
7. Use WordPress Media Library only for public website assets.
8. Never store national IDs, driving licences, or other private application documents in WordPress Media Library.
9. Keep protected form validation, submission persistence, private storage, and email behavior under Next.js control.
10. Preserve Arabic and English as independently publishable content.
11. Require meaningful alt text for editorial images.
12. Keep all public routes stable during migration.
13. Make rollback a configuration change, not a database restoration.
14. Do not delete legacy code or data before written acceptance of the complete migration.
15. Use official documentation for the installed Next.js and WordPress versions before implementing version-sensitive behavior.

## 4. Target system ownership

### 4.1 WordPress owns

- Arabic and English page content.
- Public page titles.
- SEO title and description.
- Public images and image alt text.
- Header and footer navigation menus.
- Logo and favicon.
- Site name and tagline.
- Header/footer contact information.
- Footer text, columns, links, and social links.
- Policy documents.
- Public form labels, placeholders, help text, options, button labels, and success/error copy.
- Drafts, publication status, and editorial revisions for WordPress-owned content.

### 4.2 Next.js owns

- Public URL routing.
- Arabic RTL and English LTR behavior.
- Existing public React components.
- Section order and visual composition.
- Tailwind styling, animation, responsiveness, and accessibility behavior.
- WordPress response validation and adaptation.
- Public metadata rendering.
- Draft Mode integration.
- Caching and revalidation.
- Failure handling.
- Public form rendering.
- Security-sensitive form rules.
- Server-side form validation.
- Submission API routes.
- Submission persistence and idempotency.
- SMTP notification behavior.
- Private attachment storage and protected downloads.
- Retention and deletion enforcement for private submissions.

### 4.3 Legacy custom CMS owns temporarily

- Any page or section not yet accepted from WordPress.
- Existing content used as the migration reference.
- Temporary per-page rollback during the controlled migration window.

No new feature may depend on the legacy schema.

## 5. Fully free/open-source WordPress stack

### 5.1 Required software

- WordPress Core.
- Polylang Free for Arabic/English editorial relationships.
- Carbon Fields, pinned to a reviewed release, for code-defined structured fields and repeaters.
- A custom MIT/GPL-compatible `anboba-headless` WordPress connector plugin maintained in this repository.
- WordPress native Pages.
- WordPress native Media Library.
- WordPress native navigation menus.
- WordPress native post statuses and revisions where they cover the required metadata.

### 5.2 Why Carbon Fields

Carbon Fields is selected instead of a paid field plugin because it provides code-defined fields, complex/repeating groups, media selectors, and settings containers while remaining free/open source.

Field definitions must live in the ANBOBA connector plugin and be version-controlled. Administrators must not redesign schemas in the WordPress UI.

Before installation:

- Verify the selected Carbon Fields release and license.
- Pin the exact version.
- Bundle it predictably or install it through an approved dependency process.
- Do not use `latest` in production dependency resolution.

### 5.3 Excluded tools

Do not use:

- Elementor.
- Unrestricted Gutenberg content rendering.
- ACF Pro or other paid field plugins.
- Arbitrary page-builder HTML.
- WordPress themes as the public renderer.
- WordPress shortcodes in Next.js.
- WordPress Media Library for private identity documents.

Gutenberg may be used only for a deliberately allowlisted rich-text field if a future section requires it. Its output must be transformed and sanitized, never rendered blindly.

## 6. Administrator experience

The administrator works at the WordPress admin URL.

### Pages

```text
Pages
├── Home — Arabic
├── Home — English
├── About — Arabic
├── About — English
├── Contact — Arabic
├── Contact — English
├── Join Us — Arabic
├── Join Us — English
├── Policies — Arabic
└── Policies — English
```

Each page displays only the fields relevant to that page. Section order is fixed and matches the Next.js design.

### Media

```text
Media
└── WordPress native Media Library
```

### Navigation

```text
Appearance → Menus
├── Arabic Header
├── English Header
├── Arabic Footer
└── English Footer
```

### Global settings

```text
ANBOBA → Site Settings
├── Identity
├── Header
├── Contact details
├── Footer
├── Social links
└── Application-store links
```

### Policies

```text
ANBOBA → Policies
├── Privacy — Arabic/English
├── Terms — Arabic/English
└── Refunds — Arabic/English
```

### Forms

```text
ANBOBA → Form Content
├── Contact
├── Join application
└── Partner registration
```

WordPress edits public form presentation. Protected field behavior and submission processing remain code-controlled in Next.js.

## 7. WordPress plugin architecture

The connector is a separate, versioned WordPress plugin:

```text
wordpress/
└── anboba-headless/
    ├── anboba-headless.php
    ├── composer.json
    ├── src/
    │   ├── Plugin.php
    │   ├── Activation.php
    │   ├── Capabilities.php
    │   ├── Content/
    │   │   ├── PageIdentity.php
    │   │   ├── PageFields.php
    │   │   ├── PolicyPostType.php
    │   │   ├── PolicyFields.php
    │   │   ├── FormPostType.php
    │   │   └── FormFields.php
    │   ├── Settings/
    │   │   ├── SiteSettings.php
    │   │   └── MenuLocations.php
    │   ├── Rest/
    │   │   ├── Routes.php
    │   │   ├── PageController.php
    │   │   ├── SiteController.php
    │   │   ├── PolicyController.php
    │   │   ├── FormController.php
    │   │   └── Schema.php
    │   ├── Media/
    │   │   └── MediaPresenter.php
    │   ├── Preview/
    │   │   └── PreviewLink.php
    │   ├── Webhook/
    │   │   ├── Signer.php
    │   │   └── Publisher.php
    │   └── Support/
    │       ├── Locale.php
    │       ├── Validation.php
    │       └── ErrorResponse.php
    ├── tests/
    ├── languages/
    ├── uninstall.php
    └── readme.txt
```

### Plugin rules

- Use namespaces.
- Use strict input validation and output escaping.
- Check capabilities and nonces for every administrative mutation.
- Keep public endpoints read-only and published-only.
- Keep preview endpoints authenticated and short-lived.
- Do not expose WordPress user data.
- Do not expose private post metadata.
- Return a versioned ANBOBA DTO, not raw Carbon Fields or WordPress internals.
- Return predictable machine-readable errors.
- Use stable external IDs so imports are idempotent.
- Preserve data on plugin deactivation.
- Delete data on uninstall only through an explicit, separately confirmed policy.

## 8. WordPress API contract

Use a versioned namespace:

```text
/wp-json/anboba/v1/page/{locale}/{pageKey}
/wp-json/anboba/v1/site/{locale}
/wp-json/anboba/v1/policies/{locale}
/wp-json/anboba/v1/policy/{locale}/{slug}
/wp-json/anboba/v1/form/{locale}/{formKey}
/wp-json/anboba/v1/preview/{locale}/{pageKey}
```

### Published page response

```ts
type CmsPage = {
  apiVersion: 1;
  id: string;
  pageKey: "home" | "about" | "contact" | "join-us" | "policies";
  locale: "ar" | "en";
  slug: string;
  title: string;
  status: "published";
  modifiedAt: string;
  seo: {
    title: string;
    description: string;
  };
  sections: Array<{
    key: string;
    type: string;
    content: unknown;
  }>;
};
```

### Media response

```ts
type CmsMedia = {
  id: number;
  url: string;
  alt: string;
  width: number;
  height: number;
  mimeType: string;
};
```

### Site response

```ts
type CmsSite = {
  apiVersion: 1;
  locale: "ar" | "en";
  identity: {
    siteName: string;
    tagline: string;
    logo: CmsMedia | null;
    favicon: CmsMedia | null;
  };
  headerMenu: CmsMenuItem[];
  footerMenus: CmsMenu[];
  contact: CmsContact;
  footer: CmsFooter;
  socialLinks: CmsSocialLink[];
};
```

All response schemas must be implemented in PHP and duplicated as Zod contracts in Next.js. Contract tests must verify representative fixtures from both implementations.

## 9. Next.js architecture

```text
features/
└── wordpress/
    ├── server/
    │   ├── client.ts
    │   ├── environment.ts
    │   ├── errors.ts
    │   ├── cache.ts
    │   └── request.ts
    ├── contracts/
    │   ├── common.ts
    │   ├── media.ts
    │   ├── menu.ts
    │   ├── page.ts
    │   ├── policy.ts
    │   ├── form.ts
    │   └── site.ts
    ├── queries/
    │   ├── get-page.ts
    │   ├── get-site.ts
    │   ├── get-policies.ts
    │   ├── get-policy.ts
    │   └── get-form.ts
    ├── adapters/
    │   ├── page-adapter.ts
    │   ├── site-adapter.ts
    │   ├── policy-adapter.ts
    │   └── form-adapter.ts
    └── preview/
        ├── token.ts
        └── destination.ts

app/api/wordpress/
├── preview/route.ts
├── exit-preview/route.ts
└── revalidate/route.ts
```

### Next.js rules

- Mark WordPress client modules as server-only.
- Centralize environment validation.
- Use one HTTP client wrapper with explicit timeout and error classes.
- Retry only safe GET requests and only for transient failures.
- Never log credentials, authorization headers, preview tokens, or complete sensitive payloads.
- Parse every response with Zod.
- Keep public routes responsible only for route parameters, metadata, and component composition.
- Keep WordPress-specific shapes out of public components.
- Reuse current public component prop contracts wherever practical.
- Permit WordPress image URLs only from configured CMS hosts.
- Keep preview requests out of published caches.

## 10. Environment variables

```env
WORDPRESS_URL=https://darkgoldenrod-eagle-828575.hostingersite.com
WORDPRESS_REVALIDATE_SECRET=
WORDPRESS_PREVIEW_SECRET=
WORDPRESS_USERNAME=
WORDPRESS_APPLICATION_PASSWORD=
WORDPRESS_REQUEST_TIMEOUT_MS=5000
WORDPRESS_ENABLED_PAGES=
```

Rules:

- `WORDPRESS_URL` and server-only credentials must never use `NEXT_PUBLIC_`.
- Published public GET endpoints should not require WordPress credentials.
- Application Password credentials are only for server-to-server preview/import operations.
- Use a dedicated least-privilege WordPress user.
- Store production values in Hostinger environment variables.
- Keep local values in `.env.local`.

`WORDPRESS_ENABLED_PAGES` is the controlled per-page migration switch, for example:

```env
WORDPRESS_ENABLED_PAGES=about
```

Unlisted pages remain on their current implementation until accepted.

## 11. Revalidation and preview

### Publish webhook

1. WordPress detects a transition to published content or a published-content update.
2. The connector creates an event containing event ID, event type, locale, page key, affected paths, and timestamp.
3. It signs the raw body using HMAC-SHA256 and `WORDPRESS_REVALIDATE_SECRET`.
4. Next.js verifies the signature using constant-time comparison.
5. Next.js rejects expired timestamps and previously processed event IDs.
6. Next.js allowlists the event type and affected route.
7. Next.js invalidates the exact cache tags and paths.

For the installed Next.js 16.3.3 behavior, external webhook invalidation through a Route Handler should use `revalidateTag(tag, { expire: 0 })` when immediate expiration is required. Path and data-tag invalidation should be used deliberately rather than clearing the entire site.

### Draft preview

1. WordPress generates a short-lived preview URL.
2. Next.js validates the token and confirms that the destination exists in WordPress.
3. Next.js enables Draft Mode.
4. Next.js redirects only to the CMS-validated destination.
5. Preview fetches unpublished content with server-only authentication.
6. A visible preview banner provides a POST-based exit action.

Never redirect directly to an unvalidated query-string destination.

## 12. Failure and caching policy

- Use bounded request timeouts.
- Cache normalized published documents, not raw API responses.
- Tag caches by resource and locale.
- Keep Arabic and English invalidation independent.
- Maintain a periodic expiry as a repair path if a webhook is missed.
- Do not cache preview responses.
- During migration, a failed WordPress page can be switched back through `WORDPRESS_ENABLED_PAGES`.
- Do not silently render malformed WordPress content.
- Use the current checked-in dictionary/static assets only as an explicitly documented emergency fallback where appropriate.
- Log resource key, locale, status, duration, correlation ID, and fallback decision; never log secrets or full form payloads.

Suggested tags:

```text
wordpress:page:ar:home
wordpress:page:en:about
wordpress:site:ar
wordpress:site:en
wordpress:policies:ar
wordpress:policy:ar:privacy
wordpress:form:ar:contact
```

## 13. Section-by-section delivery protocol

Every section follows the same controlled sequence:

1. **Inventory** — Record all current visible fields, defaults, images, links, and locale differences.
2. **Contract** — Define the TypeScript/Zod and PHP response schema.
3. **WordPress fields** — Add only that section’s Carbon Fields configuration.
4. **Seed/import** — Import current Arabic and English values idempotently.
5. **API** — Return only that section in the normalized page DTO.
6. **Adapter** — Convert the DTO into the existing public component props.
7. **Feature switch** — Enable WordPress only for the affected page in a non-production environment.
8. **Tests** — Run schema, API, component, route, localization, media, accessibility, and failure tests.
9. **Visual comparison** — Compare mobile and desktop screenshots in Arabic and English.
10. **Acceptance record** — Record pass/fail, defects, screenshots, and approval.
11. **Commit** — Commit the accepted section separately.
12. **Continue** — Begin the next section only after acceptance.

A section is not complete merely because it renders. It must pass all acceptance criteria.

## 14. Detailed migration order

### Phase 0 — Governance and safety

- Update `REFERENCE.md` with the approved architecture.
- Mark the old CMS implementation plan as historical.
- Record the current commit SHA and deployed release.
- Create a protected pre-migration tag/branch.
- Back up the custom CMS database and uploads if they contain unique content.
- Back up WordPress before installing the connector.
- Confirm backup restoration, not only backup creation.
- Create a dedicated migration branch.
- Freeze new custom CMS feature development.

**Gate:** Architecture documentation, source checkpoint, and restorable backups are verified.

### Phase 1 — WordPress baseline and hardening

- Record WordPress and PHP versions.
- Enable HTTPS only.
- Configure permanent links.
- Remove unused themes and plugins while retaining one safe fallback theme.
- Install and configure Polylang Free.
- Prepare Arabic and English locales.
- Add least-privilege editorial and integration users.
- Enable strong passwords and 2FA if an approved free plugin is selected.
- Review XML-RPC requirements and disable it if unused.
- Configure WordPress backups.
- Confirm REST API availability.
- Confirm WordPress can call the future Next.js webhook URL.

**Gate:** WordPress security and backup checklist passes.

### Phase 2 — Connector foundation

- Scaffold the `anboba-headless` plugin.
- Pin Carbon Fields.
- Add namespacing, activation checks, capabilities, error handling, and tests.
- Register the `/anboba/v1` REST namespace.
- Add health/version endpoint.
- Add deterministic page identities.
- Add locale validation.
- Package a reproducible plugin ZIP.

**Gate:** Plugin activates without warnings, health endpoint passes, and PHP checks pass.

### Phase 3 — Next.js WordPress foundation

- Add server-only environment validation.
- Add HTTP client with timeout and typed errors.
- Add Zod contracts.
- Add request/response fixtures.
- Add per-page feature-switch parsing.
- Add exact WordPress image-host configuration.
- Add structured logging boundary.
- Add test utilities.

**Gate:** Invalid configuration and malformed responses fail safely; build passes.

### Phase 4 — About page pilot

Migrate in this order:

1. About page identity, title, and SEO.
2. `why_choose_us` textual fields.
3. `why_choose_us` image and alt text.
4. `why_choose_us` four fixed features.
5. `vision_mission.vision`.
6. `vision_mission.mission`.

After each item, execute the full section delivery protocol.

Then enable:

```env
WORDPRESS_ENABLED_PAGES=about
```

**Gate:** `/ar/about` and `/en/about` pass content, visual, SEO, media, preview, publish, outage, and rollback tests.

### Phase 5 — Global identity and header

Migrate in this order:

1. Site name per locale.
2. Tagline per locale.
3. Logo and alt text.
4. Favicon.
5. Arabic native header menu.
6. English native header menu.
7. Header CTA label and destination if separate from the menu.
8. Mobile navigation parity.
9. Language-switcher route behavior.

**Gate:** Header matches current desktop/mobile output on every existing route in both locales.

### Phase 6 — Footer

Migrate in this order:

1. Localized brand description.
2. Arabic footer menu groups.
3. English footer menu groups.
4. Contact phone, email, and address.
5. Social links.
6. Application-store links and images.
7. Copyright/footer text.
8. Footer language switcher.
9. WhatsApp/contact CTA derivation.

**Gate:** Footer content and links match on every route; malformed settings fail safely.

### Phase 7 — Home page

Migrate in this order:

1. Home title and SEO.
2. `hero` heading fragments and description.
3. `hero` CTA.
4. `hero.showcase` heading and guarantee label.
5. `hero.showcase.guarantees` — exactly four items.
6. `hero.showcase` left phone image and alt text.
7. `hero.showcase` right phone image and alt text.
8. `service_overview` headings and description.
9. `service_overview` image and alt text.
10. `statistics` heading.
11. `statistics` — exactly four items.
12. `why_choose_us` copy.
13. `why_choose_us` image and alt text.
14. `why_choose_us` — exactly four features.
15. `service_benefits` copy.
16. `service_benefits` — exactly four cards with allowlisted icons.
17. `join_application` section copy.
18. `faq_support.faq` content and link.
19. `faq_support.support` content and link.

**Gate:** `/ar` and `/en` pass all content, visual, animation, image, SEO, preview, publish, failure, and rollback tests.

### Phase 8 — Contact page

Migrate in this order:

1. Contact title and SEO.
2. Eyebrow and heading fragments.
3. Description.
4. Contact detail items.
5. Country code and country label.
6. Contact form public content.
7. Contact form safe field definitions, if dynamic form definitions are approved.
8. Success and error copy.

Submission processing remains in Next.js.

**Gate:** `/ar/contact` and `/en/contact` pass content and submission tests without duplicate submissions.

### Phase 9 — Join Us page

Migrate in this order:

1. Join Us title and SEO.
2. Eyebrow and heading fragments.
3. Description.
4. Country code and country label.
5. Partner-registration public form content.
6. Join-application public form content.
7. Safe options and labels.
8. Benefits and note content.
9. Success and error copy.

Protected national-ID/licence keys, validation, upload rules, and storage are immutable from WordPress.

**Gate:** `/ar/join-us` and `/en/join-us` pass content, submission, private-upload, authorization, and retention tests.

### Phase 10 — Policies

Migrate in this order:

1. Policies overview hero.
2. Policy-card titles and summaries.
3. Arabic privacy policy.
4. English privacy policy.
5. Arabic terms.
6. English terms.
7. Arabic refunds policy.
8. English refunds policy.
9. Policy SEO.
10. Policy internal links.

Policy rich text must use a restricted schema of headings, paragraphs, and lists. Do not render arbitrary HTML.

**Gate:** Every policy URL passes localization, typography, content, SEO, and sanitization tests.

### Phase 11 — Forms and submissions hardening

Before production acceptance of sensitive forms:

- Enforce that private storage is outside the public web root.
- Check idempotency before storing files.
- Remove orphan files on every failure path.
- Persist and reuse browser idempotency keys across retries.
- Handle duplicate-key races by returning the canonical submission.
- Enforce a configured canonical request origin.
- Add payload-size and field-count limits.
- Align client and server validation.
- Keep protected validation presets out of generic fields.
- Add attachment checksums and detected MIME types.
- Add retention deadlines, deletion state, and consent records.
- Add a tested purge workflow.
- Add pagination, filtering, and safe deletion to the operational inbox.
- Add durable notification attempt history.
- Configure SMTP timeouts.
- Add stronger bot protection before accepting identity documents.
- Add authenticated download audit logging and `X-Content-Type-Options: nosniff`.

**Gate:** Security review and end-to-end submission tests pass on Hostinger.

### Phase 12 — Production rollout

Roll out in the same order used during migration:

1. About.
2. Header.
3. Footer.
4. Home.
5. Contact.
6. Join Us.
7. Policies.

For each rollout unit:

- Create a fresh WordPress backup.
- Confirm content and media checksums.
- Enable the exact page/global feature switch.
- Revalidate affected paths and tags.
- Run smoke tests.
- Monitor errors and latency.
- Roll back the switch immediately if thresholds fail.
- Record deployment evidence and acceptance.

**Gate:** All rollout units are accepted in production.

### Phase 13 — Legacy CMS removal

Do not remove the legacy CMS until:

- Every required page and section is accepted.
- Arabic and English are complete.
- All public images are verified.
- Header and footer are verified globally.
- Forms and private submissions are production-safe.
- WordPress backups and restore have been tested.
- Per-page rollback has been rehearsed.
- No unresolved content mismatch exists.
- The agreed observation period has passed.
- Explicit deletion approval is recorded.

Remove in this order:

1. Disable legacy CMS writes.
2. Archive final database and media exports.
3. Remove legacy dashboard navigation.
4. Remove legacy page/settings/policy editor routes.
5. Remove legacy public read paths.
6. Remove unused CMS actions and queries.
7. Remove obsolete authentication only if no operational dashboard still needs it.
8. Remove obsolete database tables only after a separate destructive-change approval.
9. Remove unused dependencies and scripts.
10. Run complete lint, typecheck, build, and production smoke tests.

## 15. Form content contract

WordPress may manage only allowlisted presentation fields:

- Label.
- Placeholder.
- Help text.
- Safe options.
- Required display marker where consistent with server rules.
- Width preset.
- Submit label.
- Success/error copy.

Next.js remains authoritative for:

- Stable field key.
- Protected field existence.
- Security-sensitive required state.
- Type validation.
- Allowed MIME types.
- File-size limits.
- National-ID/licence rules.
- Storage destination.
- SMTP destination and credentials.
- Rate limiting.
- Idempotency.
- Retention.

If an administrator attempts to publish an incompatible form definition, WordPress must reject publication with a clear field-level error, and Next.js must independently reject the response if it bypasses WordPress validation.

## 16. Testing strategy

### WordPress plugin

- PHP syntax checks.
- Unit tests for presenters, validators, signatures, and locale rules.
- REST permission tests.
- Published-versus-draft tests.
- Invalid-field and invalid-media tests.
- Import idempotency tests.
- Webhook signature and replay tests.

### Next.js

- Zod contract tests.
- Adapter unit tests.
- Request timeout and error-class tests.
- Published cache tests.
- Draft Mode tests.
- Revalidation tests.
- Per-page feature-switch tests.
- Fallback/rollback tests.
- Metadata tests.
- Public form regression tests.

### Visual and behavior matrix

For every page and section:

- Arabic desktop.
- Arabic mobile.
- English desktop.
- English mobile.
- RTL/LTR.
- Keyboard navigation.
- Focus visibility.
- Reduced motion.
- Missing image.
- Invalid image.
- Missing translation.
- Long content.
- Empty optional content.
- WordPress timeout.
- WordPress 404/401/429/500.
- Malformed JSON.
- Draft preview.
- Publish update.
- Rollback switch.

### Required project checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Do not mark a phase complete if any required check fails because of that phase.

## 17. Security checklist

- Dedicated least-privilege WordPress integration user.
- Application Password used only over HTTPS and only server-side.
- No secrets in Git, browser bundles, logs, URLs, or screenshots.
- Signed webhook body with timestamp and replay protection.
- Capability and nonce checks on WordPress writes.
- Published public endpoints expose only allowlisted fields.
- No raw post metadata exposure.
- No arbitrary HTML/CSS/JavaScript rendering.
- URL, locale, slug, target, and media-host allowlists.
- Mandatory server-side Zod validation.
- WordPress/plugin/theme update process.
- WordPress and Next.js backup/restore runbook.
- Private documents excluded from WordPress.
- Submission retention and deletion policy.
- Abuse protection for public forms.

## 18. Observability and operational requirements

Log and monitor:

- WordPress endpoint and resource key.
- Locale and page key.
- Request duration and status.
- Cache hit/miss/revalidation result.
- Contract-validation failures.
- Missing content/media.
- Webhook event ID and result.
- Preview activation failures.
- Per-page migration switch state.
- Form submission result without sensitive payloads.
- Email notification status.

Define production thresholds before cutover:

- Maximum WordPress request latency.
- Maximum acceptable error rate.
- Maximum cache fallback rate.
- Maximum content payload size.
- Maximum media size.
- Form submission latency and error budget.

## 19. Documentation deliverables

Maintain:

- WordPress installation runbook.
- Connector-plugin installation/update runbook.
- Content-editor guide in Arabic and/or English.
- Page and section field reference.
- Media and alt-text guide.
- Menu management guide.
- Draft/preview/publish guide.
- Forms and private-document policy.
- Backup/restore runbook.
- Deployment and rollback runbook.
- Environment-variable reference.
- Incident-response checklist.
- Legacy CMS retirement record.

## 20. Definition of done

The migration is complete only when:

- WordPress manages all approved Arabic and English public content.
- Every page was migrated and accepted section by section.
- Public design and behavior remain unchanged.
- All editorial images are managed in WordPress.
- Header and footer content and menus are managed in WordPress.
- SEO fields are dynamic and validated.
- Policies are structured, localized, and safe.
- Public form content is dynamic within the allowlisted contract.
- Form security and private submissions remain reliable.
- Draft preview and publish revalidation work.
- WordPress outages do not cause uncontrolled public failures.
- Lint, typecheck, build, integration, security, and visual tests pass.
- Backups and rollback have been tested.
- The legacy CMS is removed only after explicit final approval.

## 21. Product decisions still requiring confirmation

The following decisions must be confirmed before their implementation phase:

1. Will WordPress manage only form copy/options, or may administrators add, remove, and reorder safe non-protected fields?
2. Will the operational submission inbox remain in the protected Next.js dashboard, or must it eventually appear inside WordPress through a separately designed secure integration?
3. What permanent CMS domain will replace the temporary Hostinger URL?
4. Must any historical custom-CMS drafts/revisions be archived, or is published content sufficient?
5. How long should the legacy CMS remain available for rollback after full production cutover?
6. Are unlimited new dynamic pages required after the five existing pages are migrated?

These decisions must not be guessed during implementation.
