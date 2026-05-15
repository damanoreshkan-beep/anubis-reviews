# anubis-reviews

Player-reviews web component for **Anubis World**. Reads from a
Supabase `public.reviews` table and renders a glass-card grid that
visually matches the partner site's inline reviews section it
replaces. Each review keeps its source language; the widget shows a
small flag badge in the corner so the polyglot grid doesn't look
inconsistent.

Sister to [`anubis-auth-widget`](https://github.com/damanoreshkan-beep/anubis-auth-widget), [`anubis-cabinet`](https://github.com/damanoreshkan-beep/anubis-cabinet), [`anubis-payments`](https://github.com/damanoreshkan-beep/anubis-payments) and [`anubis-download`](https://github.com/damanoreshkan-beep/anubis-download). Same design system, separate concern.

## Embed

```html
<script type="module" src="https://damanoreshkan-beep.github.io/anubis-reviews/anubis-reviews.js"></script>

<anubis-reviews
  supabase-url="https://ckfinpywlpllvhvzagnw.supabase.co"
  supabase-key="sb_publishable_…"
  lang="uk"
  limit="6"
></anubis-reviews>
```

Attributes:

| | |
|---|---|
| `supabase-url` | Project URL. |
| `supabase-key` | Publishable (anon) key. The widget fetches via PostgREST; the `reviews` table has an RLS policy allowing anon SELECT on `is_active = true`. |
| `lang` | `en` · `ru` · `uk` · `de` · `pl`. Only affects the widget's own UI copy (loading / error states) — review content keeps its source language. |
| `limit` | Optional cap on how many reviews to render (default: all active). |

## Schema

```sql
create table public.reviews (
    id          uuid primary key default gen_random_uuid(),
    nick        text not null,
    rating      smallint not null default 5,
    lang        text not null check (lang in ('uk', 'ru', 'en', 'de', 'pl')),
    text        text not null,
    role        text not null,
    is_active   boolean not null default true,
    sort_order  integer not null default 0,
    created_at  timestamptz not null default now()
);
```

Admin editing is via the Supabase Studio Table Editor — no SQL needed. Edits show up on the page within ~5 minutes (visibility-change refetch) or on the next visit.

## Avatars

Steve heads pulled from `https://mc-heads.net/avatar/{nick}/64` — deterministic offline-UUID lookup, so each fake nickname keeps the same face across reloads.

## Build from source

Requires Node 22.

```bash
git clone https://github.com/damanoreshkan-beep/anubis-reviews.git
cd anubis-reviews
npm ci
npm run dev          # vite dev server with auto-mounted <anubis-reviews>
npm run build        # → dist/anubis-reviews.js (single ES module, CSS inlined)
```

A push to `main` triggers `.github/workflows/deploy.yml` which republishes the bundle to GitHub Pages at https://damanoreshkan-beep.github.io/anubis-reviews/anubis-reviews.js.

## CSS isolation

Tailwind utilities scoped to `.aw-reviews-scope`. Custom rules in `src/widget.css` are prefixed manually. The post-build script rewrites Tailwind's `*, :before, :after` / `::backdrop` resets so they don't reset host-page CSS variables.

The card markup (`.glass`, `.card-hover`, `.review-avatar`) mirrors the partner site exactly so the swap from inline cards to web component is visually invisible.
