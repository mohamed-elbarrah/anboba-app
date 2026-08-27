# Hostinger Next.js Custom CMS Project Reference

## 1. Project Summary

This project is a custom multilingual website and future CMS dashboard built with **Next.js** and hosted on **Hostinger managed/shared Node.js hosting**.

The project will not use Supabase, WordPress, Strapi, Directus, Payload, or VPS.

Final architecture:

```txt
Next.js App
├── Public website pages
├── Future dashboard CMS
├── Hostinger Managed MySQL database
└── Local/Hostinger file uploads
```

---

## 2. Hosting Decision

The app will be deployed to **Hostinger Next.js / Node.js hosting**.

Based on Hostinger official pages, Hostinger supports:

- Next.js apps
- Node.js runtime
- SSR
- ISR
- API routes / route handlers
- Dynamic rendering
- GitHub deployment
- Environment variables
- Managed MySQL database

Official references:

- https://www.hostinger.com/web-apps-hosting/nextjs-hosting
- https://www.hostinger.com/nodejs-hosting

Important note:

MySQL is **not inside the Next.js app**. It must be created separately in Hostinger hPanel.

```txt
Hostinger account
├── Next.js Node.js application
└── Hostinger Managed MySQL database
```

---

## 3. Database Decision

Database:

```txt
Hostinger Managed MySQL
```

The database will be created later from:

```txt
hPanel → Websites → Manage → Databases → MySQL Databases
```

The Next.js app will connect to MySQL using environment variables:

```env
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

For now, during the first phase, database logic should not be implemented. Only placeholders and structure should be created.

---

## 4. Main Tech Stack

Recommended stack:

```txt
Next.js latest
TypeScript
App Router
Tailwind CSS
shadcn/ui
Drizzle ORM
mysql2
Zod
React Hook Form
bcryptjs
jose
Tiptap later
```

Library purpose:

| Feature | Library |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Database ORM | Drizzle ORM |
| MySQL driver | mysql2 |
| Validation | Zod |
| Forms | React Hook Form |
| Password hashing | bcryptjs |
| Sessions/JWT | jose |
| Rich text editor | Tiptap, later |

Avoid at the beginning:

```txt
Prisma
native bcrypt
sharp
```

Reason: native/build-heavy packages may be more difficult on shared/managed hosting. They can be tested later if needed.

---

## 5. Language Support

The app must support two languages:

```txt
Arabic: ar
English: en
```

Development starts with Arabic first.

Recommended URL structure:

```txt
/ar
/ar/about
/ar/contact
/ar/join-us
/ar/policies

/en
/en/about
/en/contact
/en/join-us
/en/policies
```

Arabic pages must support RTL layout.

The language should be part of the route:

```txt
/[locale]/...
```

Supported locales:

```ts
const locales = ["ar", "en"];
const defaultLocale = "ar";
```

---

## 6. Initial Public Pages

Initial pages to design first:

```txt
Home
About
Contact Us
Join Us
Policies
```

Arabic-first route examples:

```txt
/ar
/ar/about
/ar/contact
/ar/join-us
/ar/policies
```

English routes will be prepared structurally but can be filled later.

---

## 7. Future CMS Requirement

The dashboard must eventually allow the admin to:

- Add unlimited pages
- Edit existing pages
- Manage Arabic and English content
- Upload/select images
- Edit SEO fields
- Edit page sections
- Manage contact messages
- Manage site settings

Future page model:

```txt
Page
├── slug
├── locale
├── title
├── SEO title
├── SEO description
├── status
└── sections
```

Future section types:

```txt
hero
text_block
features
gallery
faq
cta
contact_info
custom_html
```

---

## 8. Development Rule for First Phase

For the first phase, build only the structure and public page design.

Do:

- Install latest Next.js
- Install selected libraries
- Scaffold the full app structure
- Create Arabic public pages
- Prepare English route structure
- Create placeholder dashboard pages
- Add comments/titles where logic will go later

Do not:

- Implement real database logic yet
- Implement real authentication yet
- Implement uploads yet
- Implement full CMS editor yet
- Put business logic inside placeholder files

Placeholder example:

```ts
// TODO: Fetch page content from CMS database later.
```

---

## 9. Recommended Full Folder Structure

Use this as the target structure from the start:

```txt
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── join-us/
│   │   │   └── page.tsx
│   │   ├── policies/
│   │   │   └── page.tsx
│   │   └── [...slug]/
│   │       └── page.tsx
│   │
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pages/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── media/
│   │   │   └── page.tsx
│   │   ├── messages/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts
│   │   ├── contact/
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── route.ts
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── public/
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   ├── language-switcher.tsx
│   │   └── sections/
│   │       ├── hero-section.tsx
│   │       ├── content-section.tsx
│   │       ├── cta-section.tsx
│   │       └── page-title-section.tsx
│   │
│   ├── dashboard/
│   │   ├── dashboard-sidebar.tsx
│   │   ├── dashboard-header.tsx
│   │   ├── page-editor-placeholder.tsx
│   │   └── media-library-placeholder.tsx
│   │
│   └── ui/
│       └── shadcn components
│
├── features/
│   ├── pages/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── schema.ts
│   │   └── components/
│   │
│   ├── media/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   └── schema.ts
│   │
│   ├── settings/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   └── schema.ts
│   │
│   ├── auth/
│   │   ├── actions.ts
│   │   ├── session.ts
│   │   └── schema.ts
│   │
│   └── contact/
│       ├── actions.ts
│       ├── queries.ts
│       └── schema.ts
│
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── migrations/
│
├── dictionaries/
│   ├── ar.json
│   └── en.json
│
├── lib/
│   ├── locales.ts
│   ├── navigation.ts
│   ├── auth.ts
│   ├── upload.ts
│   ├── slug.ts
│   ├── seo.ts
│   └── utils.ts
│
├── styles/
│   └── dashboard.css
│
└── middleware.ts

public/
├── images/
│   └── placeholders/
└── uploads/
```

---

## 10. Important Folder Notes

### `src/app/[locale]`

Contains public multilingual routes.

### `src/app/dashboard`

Contains future admin CMS interface.

For now, these pages should only show placeholder titles.

### `src/app/api`

Contains future route handlers.

For now, these files should only contain comments/placeholders unless needed.

### `features`

Each business feature has its own actions, queries, schema, and components.

This keeps the project clean when the CMS grows.

### `db`

Contains future Drizzle/MySQL configuration and schema.

No real DB connection needed in phase 1.

### `dictionaries`

Stores static translations for Arabic and English UI labels.

### `public/uploads`

Temporary planned location for uploaded files.

Important: Before final upload implementation, test whether Hostinger keeps files after redeploy.

---

## 11. Future Database Tables

These tables will be created later:

```txt
admins
pages
page_sections
media
settings
contact_messages
```

### `admins`

```txt
id
name
email
password_hash
role
created_at
updated_at
```

### `pages`

```txt
id
locale
slug
title
meta_title
meta_description
status
created_at
updated_at
```

### `page_sections`

```txt
id
page_id
type
sort_order
content_json
created_at
updated_at
```

### `media`

```txt
id
filename
path
mime_type
size
alt_text
created_at
updated_at
```

### `settings`

```txt
id
key
value_json
created_at
updated_at
```

### `contact_messages`

```txt
id
name
email
phone
subject
message
status
created_at
```

---

## 12. Future Upload Plan

Upload handler location:

```txt
src/app/api/upload/route.ts
```

File storage location:

```txt
public/uploads/
```

or another writable Hostinger folder if needed.

Rules:

- Do not store uploads inside `src/app`.
- Do not store images as binary data in MySQL.
- Store only image path in MySQL.

Example DB value:

```txt
/uploads/hero-image.webp
```

Before finalizing upload feature, test:

1. Upload image from dashboard.
2. Restart app.
3. Redeploy app.
4. Confirm uploaded file still exists.

---

## 13. Future Authentication Plan

Dashboard will be protected by session cookies.

Recommended libraries:

```txt
bcryptjs
jose
```

Auth flow:

```txt
Admin login
↓
Validate email/password
↓
Create signed session cookie
↓
Middleware protects /dashboard
```

Do not implement auth in phase 1 except placeholders.

---

## 14. Future Dashboard Pages

Planned dashboard routes:

```txt
/dashboard
/dashboard/pages
/dashboard/pages/[id]
/dashboard/media
/dashboard/messages
/dashboard/settings
```

Dashboard responsibilities:

- Manage pages
- Manage page sections
- Manage translations
- Manage media
- View contact messages
- Manage site settings

---

## 15. Dynamic Pages Plan

The final CMS must support unlimited pages.

Public dynamic route:

```txt
src/app/[locale]/[...slug]/page.tsx
```

Example future URLs:

```txt
/ar/services
/ar/services/web-design
/ar/faq
/en/services
/en/services/web-design
```

In phase 1, this file should only include a placeholder.

Later it will:

1. Read locale and slug from URL.
2. Query the `pages` table.
3. Load page sections.
4. Render section components dynamically.

---

## 16. Initial Build Steps

### Step 1: Create latest Next.js app

```bash
npx create-next-app@latest project-name
```

Recommended choices:

```txt
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src directory: Yes
App Router: Yes
Turbopack: optional
Import alias: Yes
```

### Step 2: Install core packages

```bash
npm install drizzle-orm mysql2 zod react-hook-form @hookform/resolvers bcryptjs jose
```

### Step 3: Install shadcn/ui

```bash
npx shadcn@latest init
```

### Step 4: Create folder structure

Create all folders listed in section 9.

### Step 5: Add Arabic-first pages

Create:

```txt
/ar
/ar/about
/ar/contact
/ar/join-us
/ar/policies
```

### Step 6: Add shared public components

Create placeholder components:

```txt
site-header.tsx
site-footer.tsx
language-switcher.tsx
hero-section.tsx
content-section.tsx
cta-section.tsx
page-title-section.tsx
```

### Step 7: Add placeholder dashboard

Create placeholder pages only:

```txt
/dashboard
/dashboard/pages
/dashboard/media
/dashboard/messages
/dashboard/settings
```

### Step 8: Add placeholder DB files

Create files but do not connect yet:

```txt
src/db/index.ts
src/db/schema.ts
```

Each should contain comments only for now.

### Step 9: Add placeholder API routes

Create:

```txt
src/app/api/upload/route.ts
src/app/api/contact/route.ts
src/app/api/auth/route.ts
```

Use placeholder responses only if needed.

### Step 10: Run local development

```bash
npm run dev
```

---

## 17. Deployment Preparation Later

Before deployment, confirm in Hostinger hPanel:

- Node.js app support
- Node.js version
- Environment variables support
- MySQL database creation
- Ability to run Next.js build/start
- Persistent file storage behavior

Future production commands may be:

```bash
npm install
npm run build
npm run start
```

Exact commands depend on Hostinger hPanel deployment settings.

---

## 18. Build Philosophy

Keep the app modular:

```txt
Routes only handle routing.
Features contain business logic.
Components handle UI.
DB folder handles database schema/connection.
Lib folder contains shared helpers.
```

Do not mix everything inside page files.

Good:

```txt
app/[locale]/about/page.tsx
→ uses components/public
→ later calls features/pages/queries.ts
```

Bad:

```txt
All SQL, validation, rendering, and form logic inside page.tsx
```

---

## 19. Current Phase Goal

Current goal:

```txt
Build and design the public Arabic pages only.
```

Pages:

```txt
/ar
/ar/about
/ar/contact
/ar/join-us
/ar/policies
```

Prepare everything else as clean placeholders.

Dashboard and database logic will be implemented in later phases.

---

## 20. Final Recommended Direction

Use:

```txt
Next.js custom CMS
Hostinger Node.js hosting
Hostinger Managed MySQL
Arabic-first multilingual structure
Clean modular architecture
Dashboard later
```

This is the best fit for the project constraints:

- No third-party database
- No WordPress
- No Strapi
- No Directus
- No VPS
- Hostinger-compatible
- CMS-ready architecture
