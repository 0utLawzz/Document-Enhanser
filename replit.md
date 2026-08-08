# DocBright

DocBright is a privacy-first mobile document photo enhancer that turns dull document photos into clearer, print-ready copies without modifying the originals.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/docbright/` — Expo mobile app, local document workflow, editor, history, settings, and export.
- `artifacts/docbright/lib/documents.tsx` — local document state, enhancement, rotation, persistence, and export.
- `artifacts/docbright/lib/preferences.tsx` — local settings and appearance preferences.
- `artifacts/docbright/components/DocBrightUI.tsx` — shared DocBright mobile UI pieces.
- `artifacts/docbright/constants/colors.ts` — light and dark semantic theme tokens.

## Architecture decisions

- Document images are processed locally where possible; no image-processing API is required.
- Originals are stored as immutable source URIs while enhanced output is written separately.
- The default Print Ready preset is conservative and preserves document color rather than forcing monochrome.
- Local AsyncStorage is used for document history and preferences.

## Product

Users can capture or import one or many document photos, automatically enhance them, compare original and enhanced copies, rotate documents, apply presets, export individual results, export a ZIP on native devices, view history, and configure processing defaults.

## User preferences

- Keep the app focused on official-document fidelity; never use generative AI to rewrite or recreate document content.

## Gotchas

- Native preview uses Expo Go at the managed workflow; the browser path uses Canvas for conservative visual enhancement.
- Re-run `pnpm --filter @workspace/docbright run typecheck` after app changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
