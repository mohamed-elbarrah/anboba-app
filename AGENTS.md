<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

Also use mcp when you want work woth next js don't try guissing how its work you have review the mcp befor do or thinknig how you should do something.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions

## Mandatory Reference

Before making any change or trying give me any plans, read `REFERENCE.md`. It is the source of truth for this project's architecture, technology choices, hosting constraints, current phase, folder structure, and implementation rules.

If these instructions conflict with `REFERENCE.md`, stop and ask for clarification. Do not silently choose a different direction.

## Current Phase

The current goal is to build and design the public Arabic pages only:

- `/ar`
- `/ar/about`
- `/ar/contact`
- `/ar/join-us`
- `/ar/policies`

English routes, dashboard pages, database files, and API routes may exist only as clean placeholders.

Do not implement yet:

- Real database logic
- Authentication
- File uploads
- The CMS editor
- Business logic inside placeholder files

## Official Documentation and MCP Rule

Do not rely on training data for Next.js, shadcn/ui, or other fast-changing tools.

Before implementing or modifying framework or library functionality:

1. Check the available official MCP tools.
2. Use official documentation for the installed versions.
3. Inspect relevant local documentation under `node_modules` when available.
4. Follow current APIs and deprecation notices.
5. If official documentation or MCP information is unavailable, ask before guessing.

This is especially required for Next.js App Router, routing, layouts, metadata, Server/Client Components, middleware, route handlers, caching, rendering, deployment, and shadcn/ui.

## shadcn/ui Rules

- Before building any UI component from scratch, check the official shadcn/ui MCP or official shadcn/ui registry/documentation.
- If a suitable shadcn/ui component exists, install it using the shadcn CLI/registry and then customize or compose it.
- Do not recreate existing shadcn/ui primitives manually.
- Use the project's installed shadcn/ui conventions and components instead of introducing another UI library without approval.
- If the shadcn MCP is unavailable, check the official shadcn/ui registry/documentation before creating custom UI.
- Confirm the component's current installation and usage instructions for the installed project setup.

## Architecture Rules

- Routes handle routing only.
- Features contain business logic.
- Components contain UI.
- `db` contains database configuration and schemas.
- `lib` contains shared helpers.
- Keep business logic out of page files.
- Follow the folder structure in `REFERENCE.md`.
- Do not add alternative frameworks, databases, CMS products, or hosting services without approval.

## Change Discipline

Before coding:

- Inspect the existing files.
- Read `REFERENCE.md`.
- Check official documentation and relevant MCPs.
- Explain any planned deviation before implementing it.

After coding:

- Run the relevant typecheck, lint, and build commands.
- Report the files changed and verification results.
- Do not modify unrelated files.


