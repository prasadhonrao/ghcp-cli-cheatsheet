# GHCP CLI Cheatsheet

A polished, searchable reference site for GitHub Copilot CLI commands, workflows, and examples.

This repository contains a fast, GitHub-inspired static website that helps developers discover GitHub Copilot CLI workflows quickly, understand what commands do, and copy useful examples with minimal friction.

## Overview

GHCP CLI Cheatsheet is designed for developers who want a clean, searchable reference for GitHub Copilot CLI without having to jump between docs, terminal history, and scattered notes.

It combines command discovery, keyboard-friendly navigation, practical workflows, and concise explanations in a UI that feels familiar to GitHub users.

## Why this project exists

GitHub Copilot CLI is powerful, but learning commands and usage patterns should feel easier than spelunking through memory, browser tabs, and terminal history.

The cheatsheet experience is designed to be:

- Fast
- Minimal
- Readable
- Search-first
- Keyboard-friendly
- GitHub-native in tone and design

In short: a reference site that feels more like a great developer tool than a marketing page.

## Features

### Core experience

- Instant fuzzy search across commands, examples, prompts, tags, shortcuts, and descriptions
- Category-based browsing with sticky horizontal navigation
- Reusable command cards with descriptions, analogies, examples, and tips
- Dedicated reference sections for installation, authentication, modes, flags, slash commands, agents, MCP, plugins, and troubleshooting
- Quick recipes for common developer workflows
- One-click copy for commands and snippets
- Smooth, lightweight navigation with subtle motion only where it improves usability

### Categories

- All
- Installation
- Authentication
- Modes
- Shortcuts
- Flags
- Slash Commands
- Prefixes
- Agents
- MCP
- Plugins
- Instructions
- Recipes
- Tips
- Troubleshooting
- Resources

### Content model

The site is structured as a reference experience rather than a simple command list. Visitors should be able to move between foundational setup topics and advanced day-to-day workflows without losing context.

Each major section should support a mix of:

- Primary commands
- Related flags or variants
- Keyboard interactions
- Short conceptual explanations
- Copyable examples
- Tips and troubleshooting notes

## Design direction

The intended UX should feel inspired by:

- GitHub Docs
- GitHub Dark Theme
- Vercel Docs
- Linear
- Raycast

The design should prioritize:

- Readability
- Discoverability
- Compact, developer-friendly layouts
- Subtle hover and focus states
- Minimal shadows and restrained animation

Things to avoid:

- Flashy animation
- Neon “AI” styling
- Dashboard-heavy layouts
- Excessive gradients or blur
- Enterprise-style visual clutter

## Tech stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Fuse.js
- Framer Motion
- Lucide React
- GitHub Pages for deployment

## Architecture

The site is data-driven. Commands live in structured JSON so the UI stays easy to maintain, extend, and search.

### Data model

```ts
export type Command = {
  id: string;
  title: string;
  kind:
    | 'install'
    | 'auth'
    | 'mode'
    | 'shortcut'
    | 'flag'
    | 'slash-command'
    | 'prefix'
    | 'agent'
    | 'plugin'
    | 'recipe'
    | 'tip'
    | 'troubleshooting';
  category: string;
  subcategory?: string;
  description: string;
  analogy?: string;
  tags: string[];
  platforms?: string[];
  examples: {
    prompt?: string;
    command: string;
    explanation?: string;
  }[];
  tips?: string[];
};
```

### Example command data

```json
{
  "id": "version-command",
  "title": "/version",
  "kind": "slash-command",
  "category": "Slash Commands",
  "subcategory": "Session",
  "description": "Displays the current GitHub Copilot CLI version",
  "analogy": "Like checking the version of a developer tool installed locally",
  "tags": ["version", "help", "cli"],
  "examples": [
    {
      "command": "/version",
      "explanation": "Displays installed GitHub Copilot CLI version information"
    }
  ],
  "tips": ["Use this command to verify the installed CLI version"]
}
```

```json
{
  "id": "suggest-find-files",
  "title": "gh copilot suggest",
  "kind": "recipe",
  "category": "Recipes",
  "subcategory": "Shell Workflows",
  "description": "Generate shell commands from natural language prompts",
  "analogy": "Like asking a terminal expert what command to run",
  "tags": ["shell", "files", "search"],
  "examples": [
    {
      "prompt": "find files larger than 1GB",
      "command": "find . -size +1G",
      "explanation": "Searches for files larger than 1GB"
    }
  ],
  "tips": ["Use more specific prompts for safer command generation"]
}
```

### Project structure

```text
ghcp-cli-cheatsheet/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── search/
│   │   ├── command/
│   │   └── ui/
│   ├── data/
│   │   ├── commands.json
│   │   └── categories.json
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

## Components

### Layout

- Header
- Footer
- Container
- Section

### Search

- SearchBar
- SearchResults
- SearchHighlight

### Navigation

- CategoryPills
- StickyNavbar
- SectionIndex
- QuickJumpMenu

### Command content

- CommandCard
- CommandHeader
- ExampleBlock
- AnalogyBox
- TipsBox
- CopyButton
- ShortcutRow
- RecipeCard
- TroubleshootingItem
- ResourceLinkList

## Search expectations

Search will use fuzzy matching so queries like `find large files`, `how do I resume a session`, or `toggle reasoning` can still surface relevant results even when the wording does not exactly match a command title.

The search index should cover:

- Title
- Description
- Tags
- Examples
- Commands
- Prompt text
- Shortcuts
- Flags
- Troubleshooting keywords

## Reference sections

The site should cover the full GitHub Copilot CLI workflow, including:

- Installation and version checks
- Authentication and host-specific login
- Interactive, non-interactive, and autonomous usage modes
- Keyboard shortcuts and terminal ergonomics
- Command-line flags and runtime options
- Slash commands for session, review, planning, and automation tasks
- Special prefixes for files, shell commands, and delegation shortcuts
- Custom agents and agent-specific entry points
- MCP and external tool connections
- Plugins and extension points
- Custom instructions and repository-level guidance
- Quick recipes for exploration, review, implementation, and continuity workflows
- Troubleshooting and learning resources

## Accessibility and performance goals

### Accessibility

- Full keyboard navigation
- Clear focus states
- Screen reader support
- High-contrast readability
- Reduced-motion support

### Performance

- Static assets only
- Small bundle footprint
- Fast initial load
- Instant interactions
- Lighthouse-friendly output

## Run locally

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available scripts

- `npm run dev` — start the local Vite development server
- `npm run build` — generate the production build
- `npm run preview` — preview the production build locally
- `npm run deploy` — publish the site to GitHub Pages

## Deployment

The project is optimized for GitHub Pages and supports:

- Static builds
- Correct base path handling
- SPA-friendly routing behavior where needed

## Contributing

Contributions are welcome.

Useful contribution areas include:

- Adding command data
- Improving categorization and examples
- Refining keyboard interactions
- Polishing GitHub Pages deployment support
- Improving accessibility and mobile UX

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
