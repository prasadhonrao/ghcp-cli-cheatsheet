# GitHub Copilot CLI Cheatsheet

[![Deploy to GitHub Pages](https://github.com/prasadhonrao/ghcp-cli-cheatsheet/actions/workflows/deploy-to-gh-pages.yml/badge.svg)](https://github.com/prasadhonrao/ghcp-cli-cheatsheet/actions/workflows/deploy-to-gh-pages.yml)

A searchable reference site for GitHub Copilot CLI commands, workflows, and examples.

Built with React, Vite, and TypeScript. Data-driven — all commands are split into per-category JSON files so the UI stays easy to maintain, extend, and search.

## Features

- Instant fuzzy search across titles, descriptions, syntax, and examples (powered by Fuse.js)
- Category-based browsing with sticky top bar and horizontal category pills
- Command cards with syntax, descriptions, analogies, examples, and one-click copy buttons
- **Animated GIF demos** — real CLI recordings via VHS for each command's "See It In Action" section
- **Lightbox viewer** — expand any demo GIF to full-screen for better visibility
- **Per-command feedback** — every expanded card has "Report an issue" and "Suggest an edit" links that open a GitHub issue pre-filled with the command, syntax, category and source file
- Dark and light theme toggle
- Responsive layout — works on desktop and mobile
- **Agentic weekly update** — a Copilot coding agent checks the CLI changelog and opens PRs when commands change

## Categories

The 80 commands are organized into 11 categories:

| Category           | Commands | Description                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| 🚀 Getting Started | 10       | Install, update, help, version, feedback, limits        |
| 🔐 Authentication  | 3        | Login, logout, account switching                        |
| 💬 Chat            | 9        | Ask, clear, search, undo, new, refine, schedule prompts |
| 🧬 Models          | 3        | Model selection, experimental features, themes          |
| ⚙️ Configuration   | 17       | Directories, permissions, environment, voice, streaming |
| 💻 Code            | 10       | Diff, plan, PR management, code review, fork, branch    |
| 🤖 Agents          | 9        | Agent picker, fleet, delegate, research, tasks          |
| 🔌 MCP             | 2        | MCP and LSP server management                           |
| 🧠 Memory          | 6        | Sessions, context, compaction, sharing                  |
| 📝 Instructions    | 4        | Custom instructions, skills, plugins, plugins dashboard |
| 🔧 Troubleshooting | 7        | Diagnostics, restart, remote control, exit, diagnose    |

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
interface Command {
  id: string;
  title: string;
  syntax: string;
  description: string;
  analogy: string;
  examples: string[];
  category: string;
  note?: string;
  terminalDemo?: string; // path to GIF e.g. "images/chat/ask.gif"
  terminalVideo?: string; // optional narrated MP4, e.g. "videos/chat/ask.mp4" (played instead of the GIF)
  terminalCaptions?: string; // WebVTT captions for terminalVideo, e.g. "videos/chat/ask.vtt"
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
  "terminalDemo": "images/getting-started/changelog.gif"
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

| Script                    | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `npm run dev`             | Start the Vite development server                         |
| `npm run build`           | Type-check and create a production build                  |
| `npm run preview`         | Preview the production build locally                      |
| `npm run lint`            | Run ESLint across the project                             |
| `npm run create:tape`     | Generate VHS `.tape` files from `scripts/demos.json`      |
| `npm run create:gif`      | Record GIFs from tape files (requires VHS + Copilot auth) |
| `npm run verify:gif`      | Verify all expected GIFs are present                      |
| `npm run create:video`    | Build narrated MP4 + captions from GIFs and link them in the command JSON (requires ffmpeg) |
| `npm run verify:video`    | Validate every narrated video: streams, captions, narration sync, audible audio, JSON links |
| `npm run generate:demos`  | Run all five demo steps above in sequence                 |

## Deploy to GitHub Pages

Deployment is automated via GitHub Actions. Every push to `main` triggers the `deploy-to-gh-pages.yml` workflow which builds the app and publishes it using the GitHub Pages API (no `gh-pages` branch needed).

### One-time GitHub setup

In your repository settings:

- Go to **Settings** → **Pages**
- Under **Build and deployment**, choose **GitHub Actions**

### Site URL

`https://prasadhonrao.github.io/ghcp-cli-cheatsheet/`

## Recording demo GIFs

GIF demos are recorded locally using [VHS](https://github.com/charmbracelet/vhs) and committed to the repo. CI cannot generate them (requires a live authenticated Copilot CLI session).

```bash
# Prerequisites: VHS installed, `gh copilot` authenticated
npm run generate:demos                          # regenerate all
npm run create:gif -- --category chat           # single category
npm run create:gif -- --id chat-ask             # single command
```

### Narrated videos

A demo can optionally have spoken narration with captions. Add a `"narration"` to the demo in `scripts/demos.json`, then:

```bash
npm run create:video -- --id autopilot          # needs ffmpeg + internet (Edge Read Aloud TTS voices)
npm run create:video -- --voice en-GB-RyanNeural  # pick another voice
```

`narration` is either a string (spoken from 0s) or a list of timed segments so the voice matches what is on screen:

```json
"narration": [
  { "at": 0.5, "text": "Type /autopilot, followed by your goal." },
  { "at": 11, "text": "Copilot first asks which permission mode to use." }
]
```

`at` is the second in the recording. Read it off the GIF (for example `ffmpeg -ss 11 -i demo.gif -frames:v 1 f.png`). Write commands as plain text (`/help`): they are spoken as "slash help" and shown as `/help` in the captions. If a segment is still speaking when the next one is due, the next is delayed and the script warns you to shorten it (about 13 characters of text per second of speech).

To record the whole flow rather than just the first screen, give the demo `steps` (see existing demos) and, for a slow-starting CLI, `"waitForReady": true`. The tape then waits (visibly) until Copilot is ready instead of guessing a `startupWait`, so typed input is never lost. To skip the dead time in the final video, add `"speedUp": { "from": 1.5, "to": 39.5, "factor": 8 }` (source GIF seconds) and `create:video` plays that stretch 8x faster; `at` times in `narration` refer to the final, sped-up video. VHS on Windows also needs `ttyd` (`winget install tsl0922.ttyd`).

This synthesizes the speech, writes `public/videos/<category>/<id>.vtt` captions, muxes the audio onto the existing GIF into `public/videos/<category>/<id>.mp4` (run `create:gif` first) and sets `terminalVideo` / `terminalCaptions` on the command's JSON entry. Run `npm run verify:video` afterwards to validate the output. The player uses the video when present and falls back to the GIF if it fails to load.

## Contributing

Contributions are welcome. Useful areas:

- Adding or updating command data in the relevant file under `src/data/categories/`
- Improving categorization and examples
- Improving accessibility and mobile UX

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
