# Contributing to GHCP CLI Cheatsheet

Thank you for your interest in contributing! This guide covers everything you need to get up and running.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding or Editing Commands](#adding-or-editing-commands)
- [Adding a New Category](#adding-a-new-category)
- [Code Conventions](#code-conventions)
- [Styling](#styling)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

### Setup

```bash
git clone https://github.com/prasadhonrao/ghcp-cli-cheatsheet.git
cd ghcp-cli-cheatsheet
npm install
npm run dev
```

The dev server starts at `http://localhost:5173/ghcp-cli-cheatsheet/`.

---

## Development Workflow

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check (tsc) + production build → `dist/` |
| `npm run lint` | ESLint on all `*.ts` / `*.tsx` files |
| `npm run preview` | Serve the production build locally |

Always run `npm run build` and `npm run lint` before opening a pull request — both must pass cleanly.

---

## Adding or Editing Commands

All command data lives in `src/data/categories/`. Find the relevant file and add or edit a `Command` object.

### Command schema

```jsonc
{
  "id": "gs-9",             // required — see ID convention below
  "title": "/example",      // required — slash-command or command name only
  "syntax": "/example [--flag] <arg>", // required — full usage signature
  "description": "...",     // required — one or two sentences
  "analogy": "...",         // required — plain-English metaphor
  "category": "getting-started", // required — must match a Category id in src/types/index.ts
  "examples": [             // required — at least one entry
    "/example --flag value  # inline comment rendered as annotation"
  ],
  "note": "...",            // optional — caveats, see-also links
  "terminalDemo": {         // optional — animated terminal block
    "prompt": "$ /example --flag value",
    "output": ["line one", "line two", ""]
  }
}
```

### ID convention

IDs follow `"{2-3-letter-prefix}-{sequential-number}"`. Each category has a fixed prefix:

| Category | Prefix |
|---|---|
| getting-started | `gs` |
| authentication | `auth` |
| chat | `chat` |
| models | `mdl` |
| configuration | `cfg` |
| code | `code` |
| agents | `agt` |
| mcp | `mcp` |
| memory | `mem` |
| instructions | `ins` |
| troubleshooting | `trbl` |

Pick the next sequential number within the file (check existing IDs for the highest number).

### Inline example comments

Use `  #` (two spaces + hash) inside an `examples` string to add a comment shown as a styled annotation. The copy button copies only the command portion before the `  #`.

```json
"/changelog last 3  # show the last 3 releases"
```

---

## Adding a New Category

1. Create `src/data/categories/<slug>.json` — a flat JSON array of `Command` objects.
2. Import and spread it in `src/data/index.ts`:
   ```ts
   import myCategory from './categories/my-category.json';
   // ...
   ...(myCategory as Command[]),
   ```
3. Add a `Category` entry to the `CATEGORIES` array in `src/types/index.ts`:
   ```ts
   { label: 'My Category', id: 'my-category', icon: '🔖' }
   ```
   `CATEGORIES` is the source of truth for display order — place the new entry at the desired position.

---

## Code Conventions

This project follows strict conventions enforced by TypeScript and ESLint. Violations will cause `npm run build` or `npm run lint` to fail.

### Components

- **Named exports only** — no `export default` from component files.
- **Local `interface Props`** — declare immediately before the component function; do not export it or name it after the component.
- **`import type` for type-only imports** — required by `verbatimModuleSyntax: true` in `tsconfig.app.json`.
- **No `const enum`** — `erasableSyntaxOnly: true` forbids it; use plain `enum` or union string types.
- **Sub-components are file-local** — declare helper components in the same file, above the exported component; do not export them.
- **No dead code** — `noUnusedLocals` and `noUnusedParameters` are enabled; remove unused variables rather than suppressing the warning.

### Accessibility

Every interactive element that is not a native `<button>` or `<a>` must have:

```tsx
role="button"
tabIndex={0}
onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { /* handler */ } }}
```

### State

All application state (`theme`, `searchQuery`, `activeCategory`, `expandedCards`) lives in `App.tsx`. Do not introduce React context or external state libraries unless there is a compelling reason discussed in the issue first.

---

## Styling

- All colors use CSS custom properties (`--color-*`) following GitHub Primer naming.
- When adding a new color token, add it to **both** the dark block (`:root, html[data-color-mode='dark']`) and the light block (`html[data-color-mode='light']`) in `src/index.css`.
- No inline styles, no CSS-in-JS, no Tailwind, no CSS Modules — plain global CSS only.
- Test both dark mode (default) and light mode (toggle in the top bar) after any visual change.

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes following the conventions above.
3. Run `npm run build` and `npm run lint` — both must pass with zero errors.
4. Write a clear PR description explaining *what* changed and *why*.
5. For data-only changes (adding/editing commands), include before/after screenshots of the card if the output changed visually.
6. Open the pull request against `main`.

### PR title format

Use [Conventional Commits](https://www.conventionalcommits.org/) style:

| Prefix | When to use |
|---|---|
| `feat:` | New commands, new categories, new UI features |
| `fix:` | Bug fixes in UI logic or incorrect command data |
| `docs:` | README, CONTRIBUTING, or comment updates |
| `chore:` | Dependency updates, build config, tooling |
| `style:` | CSS or formatting changes with no logic impact |
| `refactor:` | Internal code restructuring with no behavior change |

---

## Reporting Issues

- **Incorrect or outdated command data** — open an issue with the incorrect value, the correct value, and a reference link (e.g., official GitHub Copilot docs).
- **UI bugs** — include your browser, OS, and a screenshot or screen recording.
- **Feature requests** — describe the use case, not just the solution.

Search existing issues before opening a new one to avoid duplicates.
