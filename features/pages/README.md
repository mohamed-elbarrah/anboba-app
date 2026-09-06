# Content migration foundation

The page map mirrors the currently rendered pages and keeps section order code-owned. `page_sections.content_json` is validated by the section-specific Zod schemas, then adapted to the existing public component contracts; public routes are intentionally unchanged in this phase.

Known compatibility boundaries:

- The policies overview and document navigation currently own labels, descriptions, arrows, and document lookup in `components/public/legal-policy.tsx`. The `policies` section stores the existing `pageTitle` plus all legal documents, while the adapter does not invent CMS fields for those hardcoded labels.
- Header/footer behavior (logo, navigation construction, app-store placeholders, copyright year, and WhatsApp fallback) remains code-owned. The seed stores locale-namespaced `pages` and `footer` settings for the future adapter, without integrating them publicly.
- Form validation stays in `features/contact` and `features/join-us`; CMS content includes the existing validation messages only so labels/messages can migrate without changing validation rules.
- Public routes now read published revisions through `features/pages/public-content.ts`. If a local development database is unavailable or unseeded, that boundary logs a warning and uses the original dictionaries/legal modules; production errors and missing published content are thrown.
- Header/footer content and policy-overview navigation labels remain intentionally code-owned. The CMS supplies page sections and legal document data, while the existing header/footer construction, app-store placeholders, WhatsApp fallback, and overview copy remain unchanged.

Run `pnpm db:seed:content` only with an intentionally configured local MySQL database. The seed is not run automatically and must not be pointed at Hostinger until reviewed.
