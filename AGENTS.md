# AGENTS.md — GitHub Copilot CLI Cheatsheet

> Quick reference for AI coding agents working in this repo. See [README.md](README.md) for full project overview.

## Commands

```bash
npm run dev        # start Vite dev server (localhost:5173)
npm run build      # tsc type-check + vite build → dist/
npm run lint       # ESLint (ts/tsx only)
npm run preview    # preview production build locally
npm run deploy     # build + gh-pages publish to GitHub Pages
```

## Architecture in 30 seconds

- **Data** — 11 JSON files in `src/data/categories/` → merged flat array in `src/data/index.ts` → consumed by `App.tsx` as a module-scope `const`. No runtime fetches.
- **State** — All state (`theme`, `searchQuery`, `activeCategory`, `expandedCards`) lives in `App.tsx`. No context, no stores.
- **Search** — Fuse.js index built once via `useMemo` with weighted keys; multi-variant query (normalized, slash-stripped, slash-prefixed) deduplicated and priority-sorted.
- **Theming** — `data-color-mode` attribute on `<html>` switches CSS var sets; persisted to `localStorage` key `ghcp-theme`.

## Adding a new command category

1. Create `src/data/categories/<slug>.json` — flat array of `Command` objects.
2. Import and spread it in `src/data/index.ts`.
3. Add a `Category` entry to `CATEGORIES` in `src/types/index.ts` (this file owns both types **and** the categories data array — do not move it).

## Adding commands to an existing category

Edit the matching `src/data/categories/<slug>.json`. Follow these conventions:

| Field | Convention |
|---|---|
| `id` | `"{2-3-letter-prefix}-{n}"` — prefix abbreviates the category slug (e.g. `gs-5`, `chat-2`) |
| `title` | The slash-command or command name alone (e.g. `"/bug"`) |
| `syntax` | Full usage signature with args; may equal `title` for simple commands |
| `examples` | Plain strings; use `"  #"` (two-space hash) to add an inline comment rendered as a styled annotation |
| `note` | Omit entirely when not needed (only truly optional field alongside `terminalDemo`) |
| `terminalDemo` | Optional `{ prompt: string; output: string[] }` for an animated terminal block |

## Component conventions

- **Named exports only** — no default exports from components.
- **Local `interface Props`** — declare immediately before the function, not exported, not named after the component.
- **`import type`** for type-only imports — required by `verbatimModuleSyntax: true`.
- **No `const enum`** — `erasableSyntaxOnly: true` forbids it; use plain `enum` or union types.
- **Sub-components stay file-local** — extract into the same file above the exported component; do not export them.
- **Accessibility** — interactive non-button elements need `role="button"`, `tabIndex={0}`, and `onKeyDown` handling for `Enter`/`Space`.

## Styling

- All colors via CSS custom properties (`--color-*`) following GitHub Primer naming.
- When adding a new color token, add it to **both** the dark block (`:root, html[data-color-mode='dark']`) and the light block (`html[data-color-mode='light']`) in `src/index.css`.
- No inline styles, no CSS-in-JS, no Tailwind, no CSS Modules — plain global CSS only.

## TypeScript notes

- No top-level `strict: true`; individual strict options are selectively enabled (see `tsconfig.app.json`).
- `noUnusedLocals` and `noUnusedParameters` are on — remove dead code rather than suppressing.
- `moduleResolution: "bundler"` — Vite handles transpilation; TypeScript is type-check only (`noEmit: true`).

## Deployment

- Vite `base` is `/ghcp-cli-cheatsheet/` (GitHub Pages path) — do not change without also updating the gh-pages config.
- `npm run deploy` runs `predeploy` (build) then publishes `dist/` via `gh-pages`.
