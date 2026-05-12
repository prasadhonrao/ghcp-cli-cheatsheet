# GHCP CLI Cheatsheet

A searchable reference site for GitHub Copilot CLI commands, workflows, and examples.

Built with React, Vite, and TypeScript. Data-driven — all 64 commands live in a single JSON file so the UI stays easy to maintain, extend, and search.

## Features

- Instant fuzzy search across titles, descriptions, syntax, and examples (powered by Fuse.js)
- Category-based browsing with sticky top bar and horizontal category pills
- Command cards with syntax, descriptions, analogies, copyable examples, and notes
- Dark and light theme toggle
- Responsive layout — works on desktop and mobile

## Categories

The 64 commands are organized into 11 categories:

| Category | Commands | Description |
|---|---|---|
| 🚀 Getting Started | 8 | Install, update, help, version, feedback |
| 🔐 Authentication | 3 | Login, logout, account switching |
| 💬 Chat | 6 | Ask, clear, copy, search, undo |
| 🧬 Models | 3 | Model selection, experimental features, themes |
| ⚙️ Configuration | 14 | Directories, permissions, environment, voice, streaming |
| 💻 Code | 4 | Diff, plan, PR management, code review |
| 🤖 Agents | 8 | Agent picker, fleet, delegate, research, tasks |
| 🔌 MCP | 2 | MCP and LSP server management |
| 🧠 Memory | 6 | Sessions, context, compaction, sharing |
| 📝 Instructions | 3 | Custom instructions, skills, plugins |
| 🔧 Troubleshooting | 7 | Diagnostics, restart, downgrade, remote control |

## Tech stack

- [React 19](https://react.dev/) — UI framework
- [Vite](https://vite.dev/) — Build tool and dev server
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Fuse.js](https://www.fusejs.io/) — Fuzzy search
- [@primer/octicons-react](https://primer.style/foundations/icons) — GitHub-style icons
- CSS custom properties — Theming (dark mode default)

## Architecture

### Data model

All command data lives in `src/data/commands.json`. Categories and their metadata are defined in `src/types/index.ts`.

```ts
interface Command {
  id: string;
  title: string;
  syntax: string;
  description: string;
  analogy: string;
  examples: string[];
  category: string;
  note?: string;
}
```

### Example command entry

```json
{
  "id": "gs-8",
  "title": "/version",
  "syntax": "/version",
  "description": "Display version information for the installed Copilot CLI and check whether an update is available.",
  "analogy": "Like checking the label on a medicine bottle — always know which version you are running before troubleshooting.",
  "examples": [
    "/version  # print installed version",
    "/update  # update if an upgrade is available"
  ],
  "category": "getting-started"
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
│   │   └── commands.json
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

| Component | Path | Purpose |
|---|---|---|
| TopBar | `layout/TopBar.tsx` | Sticky header with brand, GitHub link, and theme toggle |
| SearchBar | `search/SearchBar.tsx` | Fuzzy search input with Fuse.js |
| CategoryPills | `ui/CategoryPills.tsx` | Horizontal category filter buttons |
| TipBanner | `ui/TipBanner.tsx` | Rotating tips banner |
| CategorySection | `command/CategorySection.tsx` | Groups commands under a category heading |
| CommandCard | `command/CommandCard.tsx` | Individual command card with syntax, analogy, examples |

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

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Contributing

Contributions are welcome. Useful areas:

- Adding or updating command data in `src/data/commands.json`
- Improving categorization and examples
- Improving accessibility and mobile UX

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
