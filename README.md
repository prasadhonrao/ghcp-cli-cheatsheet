# GHCP CLI Cheatsheet

A searchable reference site for GitHub Copilot CLI commands, workflows, and examples.

Built with React, Vite, and TypeScript. Data-driven — all 64 commands are split into per-category JSON files so the UI stays easy to maintain, extend, and search.

## Features

- Instant fuzzy search across titles, descriptions, syntax, and examples (powered by Fuse.js)
- Category-based browsing with sticky top bar and horizontal category pills
- Command cards with syntax, descriptions, analogies, examples with one-click copy buttons, and notes
- Dark and light theme toggle
- Responsive layout — works on desktop and mobile

## Categories

The 64 commands are organized into 11 categories:

| Category           | Commands | Description                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| 🚀 Getting Started | 8        | Install, update, help, version, feedback                |
| 🔐 Authentication  | 3        | Login, logout, account switching                        |
| 💬 Chat            | 6        | Ask, clear, copy, search, undo                          |
| 🧬 Models          | 3        | Model selection, experimental features, themes          |
| ⚙️ Configuration   | 14       | Directories, permissions, environment, voice, streaming |
| 💻 Code            | 4        | Diff, plan, PR management, code review                  |
| 🤖 Agents          | 8        | Agent picker, fleet, delegate, research, tasks          |
| 🔌 MCP             | 2        | MCP and LSP server management                           |
| 🧠 Memory          | 6        | Sessions, context, compaction, sharing                  |
| 📝 Instructions    | 3        | Custom instructions, skills, plugins                    |
| 🔧 Troubleshooting | 7        | Diagnostics, restart, downgrade, remote control         |

## Tech stack

- [React 19](https://react.dev/) — UI framework
- [Vite](https://vite.dev/) — Build tool and dev server
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Fuse.js](https://www.fusejs.io/) — Fuzzy search
- [@primer/octicons-react](https://primer.style/foundations/icons) — GitHub-style icons
- CSS custom properties — Theming (dark mode default)

## Architecture

### Data model

Command data is split into per-category JSON files under `src/data/categories/`. They are merged in `src/data/index.ts` and imported by `App.tsx`. Categories and their metadata are defined in `src/types/index.ts`.

```ts
interface TerminalDemo {
  prompt: string;
  output: string[];
}

interface Command {
  id: string;
  title: string;
  syntax: string;
  description: string;
  analogy: string;
  examples: string[];
  category: string;
  note?: string;
  terminalDemo?: TerminalDemo;
}
```

Each `examples` entry is a plain string. Comments after `  #` are rendered separately; the copy button copies only the command portion.

### Example command entry

```json
{
  "id": "gs-2",
  "title": "/changelog",
  "syntax": "/changelog [summarize] [VERSION|last N|since VERSION]",
  "description": "Display the CLI changelog. Add the keyword \"summarize\" for an AI-generated summary. Also available as /release-notes.",
  "analogy": "Like reading the \"What is New\" page after an app update — find out exactly what changed and which commands are new.",
  "examples": [
    "/changelog  # show recent release notes",
    "/changelog last 3  # show the last 3 releases",
    "/changelog summarize  # AI-generated summary of recent changes",
    "/release-notes  # alias for /changelog"
  ],
  "category": "getting-started",
  "terminalDemo": {
    "prompt": "$ /changelog last 2",
    "output": [
      "",
      "## v1.4.0  (2025-04-28)",
      "  • /fleet now supports parallel subagent execution",
      "  • /delegate creates pull requests automatically",
      "  • Improved context window visualization in /context",
      "",
      "## v1.3.2  (2025-04-10)",
      "  • /mcp reload no longer requires session restart",
      "  • Fixed /undo edge case with binary files"
    ]
  }
}
```

### Project structure

```text
ghcp-cli-cheatsheet/
├── public/
├── src/
│   ├── components/
│   │   ├── command/
│   │   │   ├── CategorySection.tsx
│   │   │   └── CommandCard.tsx
│   │   ├── layout/
│   │   │   └── TopBar.tsx
│   │   ├── search/
│   │   │   └── SearchBar.tsx
│   │   └── ui/
│   │       ├── CategoryPills.tsx
│   │       └── TipBanner.tsx
│   ├── data/
│   │   ├── index.ts              ← merges all category files
│   │   └── categories/
│   │       ├── getting-started.json
│   │       ├── authentication.json
│   │       ├── chat.json
│   │       ├── models.json
│   │       ├── configuration.json
│   │       ├── code.json
│   │       ├── agents.json
│   │       ├── mcp.json
│   │       ├── memory.json
│   │       ├── instructions.json
│   │       └── troubleshooting.json
│   ├── types/
│   │   └── index.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Components

| Component       | Path                          | Purpose                                                 |
| --------------- | ----------------------------- | ------------------------------------------------------- |
| TopBar          | `layout/TopBar.tsx`           | Sticky header with brand, GitHub link, and theme toggle |
| SearchBar       | `search/SearchBar.tsx`        | Fuzzy search input with Fuse.js                         |
| CategoryPills   | `ui/CategoryPills.tsx`        | Horizontal category filter buttons                      |
| TipBanner       | `ui/TipBanner.tsx`            | Rotating tips banner                                    |
| CategorySection | `command/CategorySection.tsx` | Groups commands under a category heading                |
| CommandCard     | `command/CommandCard.tsx`     | Individual command card with syntax, analogy, examples  |

## Run locally

### Prerequisites

- Node.js 18+
- npm 9+

### Install and start

```bash
npm install
npm run dev
```

### Build for production

```bash
npm run build
npm run preview
```

## Available scripts

| Script            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite development server                  |
| `npm run build`   | Type-check and create a production build           |
| `npm run preview` | Preview the production build locally               |
| `npm run lint`    | Run ESLint across the project                      |
| `npm run deploy`  | Build and publish `dist/` to the `gh-pages` branch |

## Deploy to GitHub Pages

This project is configured for GitHub Pages deployment **without GitHub Actions**.

### One-time GitHub setup

In your repository settings:

- Go to **Settings** → **Pages**
- Under **Build and deployment**, choose **Deploy from a branch**
- Select the `gh-pages` branch
- Select the `/ (root)` folder

### Publish a new version

Run:

```bash
npm install
npm run deploy
```

The deploy script builds the app and publishes the contents of `dist/` to the `gh-pages` branch.

### Site URL

Once published, the site will be available at:

`https://prasadhonrao.github.io/ghcp-cli-cheatsheet/`

## Contributing

Contributions are welcome. Useful areas:

- Adding or updating command data in the relevant file under `src/data/categories/`
- Improving categorization and examples
- Improving accessibility and mobile UX

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
