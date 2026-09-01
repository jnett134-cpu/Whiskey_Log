# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal tasting log ("My Tasting Log"). Upload a photo of a bottle/drink label, tag it
with name, category, rating, date, and location, add notes; entries show as cards in a
searchable/sortable gallery. Next.js App Router + Supabase (Postgres + Storage), deployed on
Vercel.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build; also runs type + lint checks
npm start        # serve the production build
```

- **No test suite** and no standalone lint script — `next build` is the only check.
- Requires `.env.local` (copy from `.env.local.example`) with `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. `next build` succeeds with
  placeholder values; anything that touches Supabase at runtime needs real ones.

## Architecture

**JavaScript only** — no TypeScript, components are `.js`. Styling is one hand-written
stylesheet, `app/globals.css`, class-based (no CSS modules, no Tailwind).

**Data access is server-only.** Every query goes through `getSupabaseServerClient()` in
`lib/supabaseServer.js`, which builds a client with the **service role key** — it bypasses
row-level security. There is no browser-side Supabase client and **no auth**: anyone with
the URL can read and write. Never import `supabaseServer` into a Client Component.

**Server Components + small client islands.** Pages are async Server Components marked
`export const dynamic = "force-dynamic"` (always fresh reads, no caching). The only
`"use client"` files are interactive leaves: `app/upload/page.js`,
`app/bottle/[id]/edit/EditBottleForm.js`, `app/SortMenu.js`.

**Next 15 gotcha:** `params` and `searchParams` are Promises — `await` them in every page
and route handler (the codebase already does this everywhere).

**Forms are uncontrolled.** API routes parse `await request.formData()`; the client just
does `new FormData(e.target)` and POSTs/PATCHes multipart. Empty strings are normalized to
`null` before insert/update.

### Data model

Single table `bottles`: `id` (uuid), `name` (not null), `image_url` (not null), `notes`,
`rating` (smallint 1–5, CHECK), `tasted_on` (date), `location` (text), `category` (text,
CHECK-constrained to the 7 allowed values), `created_at`.

- **No migration tooling.** `supabase-schema.sql` holds the `create table` plus commented
  `alter table` snippets. Schema changes are applied **by hand in the Supabase SQL editor**;
  update that file in the same change.
- The category list lives in `lib/categories.js` (`CATEGORIES`) and **must stay in sync**
  with the CHECK constraint in `supabase-schema.sql`.

### Image storage

Supabase Storage **public** bucket `bottle-images`; objects at
`labels/<timestamp>-<rand>.<ext>`. `image_url` stores the full public URL. `POST /api/upload`
uploads the file then inserts the row. `PATCH /api/bottle/[id]` only touches storage if a new
file is attached, and after a successful swap deletes the previous object (best-effort,
path derived from the substring after `/bottle-images/`).

### Routes

| Path | Kind | Notes |
|---|---|---|
| `app/page.js` | Server | Gallery. `?q=` → case-insensitive `ilike` substring match across name/location/category/notes (`.or()`). `?sort=` → `date` (default) \| `name` \| `rating` \| `category`. Both are plain GET params and compose. |
| `app/bottle/[id]/page.js` | Server | Detail view. |
| `app/bottle/[id]/edit/page.js` | Server | Fetches the row, renders `EditBottleForm` (client). |
| `app/api/upload/route.js` | `POST` | Multipart; creates a bottle. |
| `app/api/bottle/[id]/route.js` | `PATCH` | Multipart; updates a bottle. |

`app/SortMenu.js` is a `<details>` dropdown with added outside-click / Escape dismissal.

## Conventions

- New styles go in `app/globals.css`. Reusable patterns already there: `.upload-page` form
  rules cover `input`/`select`/`textarea`; `.meta` for muted secondary text; `.header-row`
  for the top bar; `.controls` / `.search` / `.sort-menu` for the gallery toolbar.
- `postcss` is pinned via `overrides` to `^8.5.26` — a security fix Next 15's own dependency
  otherwise holds back. Don't drop the override without confirming Next ships a patched
  version.

## Deploy

Vercel, from GitHub `jnett134-cpu/Whiskey_Log` (Supabase project is linked to the repo). The
same three env vars must be set in the Vercel project settings.
