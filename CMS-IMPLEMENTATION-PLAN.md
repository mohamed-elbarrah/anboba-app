# ANBOBA CMS Implementation Plan

> Working reference for the CMS/database phase. Read this file before planning or implementing CMS work.
>
> The project source of truth remains `REFERENCE.md`; this document defines the approved execution plan for the next phase.

## 1. Objective

Make the existing public Arabic and English page content dynamic through a custom CMS backed by Hostinger Managed MySQL, without changing the current public design or user experience.

The CMS must allow an admin to:

- View the available pages as a list.
- Edit Arabic and English content.
- Edit supported images, image alt text, buttons, links, SEO fields, repeated items, and policy content.
- Preview unsaved changes live in desktop, tablet, and mobile viewports.
- Save drafts, publish changes, preview, and discard changes.

## 2. Explicitly Out of Scope

Do not implement during this phase:

- Authentication or dashboard protection.
- User roles or permissions.
- File upload implementation or media storage.
- Elementor-style visual page building.
- Arbitrary HTML/CSS editing.
- Section reordering.
- Section hide/show controls.
- Section deletion or creation by the admin.
- Design editing: colors, fonts, spacing, responsive CSS, layout, or animations.
- Real business logic in unrelated placeholder routes.

Authentication will be added after the CMS works correctly and is verified.

## 3. Non-Negotiable Invariants

### Public website

- Existing public URLs must continue working.
- Existing public pages must look and behave exactly as they do now.
- Existing public components and styling should be reused, not redesigned.
- RTL Arabic and LTR English behavior must remain unchanged.
- Public forms and their validation rules remain code-controlled.
- CMS content changes data only; they must not change the design system.

### CMS

- Sections are fixed per page and remain in their existing order.
- Admin edits section fields only.
- Each locale has independent content.
- Draft content must not affect the public site until published.
- Preview must use the same public section components as the live page.
- Database access must remain server-only.
- Secrets must never be exposed to client components or committed to git.

## 4. Current Codebase Findings

The current public pages already have a useful content boundary:

```txt
dictionaries/ar.json
       ↓
lib/dictionaries.ts
       ↓
Existing public section components
```

Examples include:

- `components/public/sections/hero-section.tsx`
- `components/public/sections/service-overview-section.tsx`
- `components/public/sections/statistics-section.tsx`
- `components/public/sections/why-choose-us-section.tsx`
- `components/public/sections/service-benefits-section.tsx`
- `components/public/sections/contact-section.tsx`
- `components/public/sections/partner-registration-section.tsx`
- `content/legal/policies.ts`

The migration must preserve the existing component prop contracts. A CMS adapter will convert database records into the same content types currently used by the components.

## 5. Approved CMS Experience

### Pages list

`/dashboard/pages` displays:

- Page name.
- Arabic and English completion status.
- Draft/published status.
- Last updated timestamp.
- Edit action.
- Preview action.

### Page editor

`/dashboard/pages/[id]` contains:

- Locale tabs: Arabic and English.
- Fixed ordered section list.
- Section-specific fields.
- Image fields and alt text fields.
- Button labels and URLs.
- SEO title and description.
- Save Draft.
- Publish.
- Discard.
- Preview.

Desktop layout:

```txt
┌──────────────────────┬─────────────────────────┐
│ Content fields        │ Live preview             │
│ Arabic / English      │ Desktop / Tablet /      │
│ Fixed sections        │ Mobile                  │
│ Save / Publish        │ Existing public design  │
└──────────────────────┴─────────────────────────┘
```

On smaller dashboard screens, use `Fields` and `Preview` tabs.

### Preview

The preview must render the existing public components with draft state:

```txt
Draft editor state
        ↓
CMS content adapter
        ↓
Existing public page renderer
```

It must support:

- Desktop viewport.
- Tablet viewport.
- Mobile viewport.
- Arabic RTL preview.
- English LTR preview.
- Unsaved local edits.

Do not create a second, separate preview design.

## 6. Fixed Page and Section Map

The initial CMS must cover the existing public pages without changing their structure.

### Home

```txt
Hero
Service Overview
Statistics
Why Choose Us
Service Benefits
Join Application
FAQ Support
```

### About

```txt
Why Choose Us
Vision and Mission
```

### Contact

```txt
Contact
```

### Join Us

```txt
Partner Registration
```

### Policies

```txt
Policy document title and summary
Policy sections
Paragraphs
Lists
```

The exact field map must be extracted from the existing TypeScript content types and JSON before schema implementation.

## 7. Database Model

Use Hostinger Managed MySQL with Drizzle ORM.

Initial tables:

```txt
pages
page_sections
settings
contact_messages
```

Future tables, not implemented in this phase:

```txt
admins
media
```

Suggested conceptual model:

```txt
pages
├── id
├── locale
├── slug
├── title
├── meta_title
├── meta_description
├── status
├── created_at
└── updated_at

page_sections
├── id
├── page_id
├── section_key
├── section_type
├── sort_order       # internal only; not editable in dashboard
├── content_json
├── created_at
└── updated_at
```

`section_key` identifies a fixed section, such as `hero`, `statistics`, or `contact`. `content_json` stores validated content for that section. The exact columns and indexes must be finalized after inspecting all existing content types.

## 8. Data and Validation Rules

- Validate section content with Zod on the server.
- Keep section schemas typed and discriminated by `section_type`.
- Keep form validation rules in code; CMS may edit labels and messages but not validation behavior.
- Validate URLs, image paths, required fields, and locale values.
- Never render untrusted arbitrary HTML.
- If rich text is required later, use the approved Tiptap direction from `REFERENCE.md`, with sanitization and a limited format set.

## 9. Draft and Publish Behavior

```txt
Admin edits fields
        ↓
Local draft state
        ↓ Save Draft
Database draft
        ↓ Publish
Database published content
        ↓
Public website
```

Required behavior:

- Save Draft persists changes without publishing.
- Publish persists and activates the current content.
- Discard restores the last saved state after confirmation.
- Preview never publishes.
- Publishing must validate all required content for the selected locale.

## 10. Approved Project Structure

```txt
app/dashboard/
├── page.tsx
└── pages/
    ├── page.tsx
    └── [id]/
        └── page.tsx

components/dashboard/
├── pages-list.tsx
├── page-editor.tsx
├── section-fields.tsx
├── page-preview.tsx
└── device-preview-switcher.tsx

features/pages/
├── schema.ts
├── types.ts
├── queries.ts
├── actions.ts
├── content-adapter.ts
└── section-config.ts

db/
├── index.ts
├── schema.ts
└── migrations/
```

Responsibilities:

- `app`: routing and page composition only.
- `components`: dashboard and public UI only.
- `features/pages`: page CMS business logic, validation, queries, and actions.
- `db`: Drizzle connection, schema, and migrations.
- `content-adapter.ts`: database content to existing public component prop types.

## 11. Execution Phases

### Phase 0 — Baseline and inventory

- Read `REFERENCE.md` and this plan.
- Inspect all current page components, dictionaries, policy content, and types.
- Create a complete field map.
- Run lint and build before changes.
- Record the current public page behavior as the visual baseline.

### Phase 1 — Database foundation

- Confirm Hostinger MySQL availability and credentials in hPanel.
- Create local `.env.local` only for local secrets.
- Add server-only Drizzle connection in `db/index.ts`.
- Define `db/schema.ts`.
- Configure migrations using the installed Drizzle version.
- Create and verify database tables.

### Phase 2 — Content migration

- Seed Arabic and English content from the existing JSON and policy modules.
- Preserve the current content structure and values.
- Implement page queries.
- Implement the content adapter.
- Add temporary fallback behavior if needed for safe migration.

### Phase 3 — Public CMS integration

- Change public pages to read published CMS content.
- Keep the existing section components unchanged wherever possible.
- Verify every public URL visually and behaviorally against the baseline.
- Verify Arabic RTL and English LTR rendering.

### Phase 4 — Dashboard pages list

- Implement `/dashboard` placeholder overview.
- Implement `/dashboard/pages`.
- Display fixed available pages and status information.
- Do not add auth yet.

### Phase 5 — Dashboard editor and preview

- Implement `/dashboard/pages/[id]`.
- Add Arabic/English tabs.
- Add fixed section-specific field forms.
- Add local draft state.
- Add shared public renderer preview.
- Add desktop/tablet/mobile preview controls.
- Add Save Draft, Publish, Preview, and Discard.

### Phase 6 — Verification and hardening

- Test draft isolation.
- Test publishing.
- Test discard behavior.
- Test invalid and incomplete translations.
- Test all page sections.
- Run lint, typecheck if available, and production build.
- Verify no visual regressions on public pages.

### Later phases

Only after this phase is stable:

- Authentication and protected dashboard.
- Media library and uploads.
- Rich text editor if required.
- Revision history.
- Roles and permissions.
- Additional dynamic pages.

## 12. Environment Rules

Local development:

```txt
.env.local
```

Production:

```txt
Hostinger hPanel environment variables
```

Use server-only variables:

```env
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Do not use `NEXT_PUBLIC_` for database credentials. Do not commit secrets.

## 13. Subagent Orchestration Rules

Subagents must work in small, isolated phases:

1. Inventory agent: inspect existing content and produce the field map only.
2. Schema agent: design Drizzle schema from the approved field map.
3. Database agent: implement connection and migrations only.
4. Migration agent: seed existing content and implement adapter.
5. Public integration agent: connect published content without redesigning components.
6. Dashboard agent: implement pages list and editor.
7. Preview agent: implement shared live preview and device modes.
8. QA agent: test regressions and build.

Rules:

- Each agent reads `REFERENCE.md` and this file first.
- Agents must not expand scope.
- Agents must not redesign public components.
- Agents must not implement authentication during this phase.
- Agents must not modify unrelated files.
- Later agents review earlier output before editing.
- Run verification after every phase.

## 14. Definition of Done

This phase is complete when:

- Current public pages look unchanged.
- Arabic and English content is stored in MySQL.
- Public pages render published database content.
- Dashboard pages can be listed and opened.
- Admin can edit both locales.
- Admin can edit supported text, images, links, and repeated content.
- Admin can save drafts, publish, preview, and discard.
- Preview supports desktop, tablet, and mobile modes.
- No reorder, hide/show, or delete controls exist.
- No authentication is implemented yet.
- Lint and production build pass.
- No secrets are committed.
