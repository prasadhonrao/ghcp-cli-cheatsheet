---
name: "Cheatsheet Updater"
description: "Weekly check (Mondays) for new GitHub Copilot CLI features and updates. Opens a PR if the cheatsheet content needs updating."
on:
  schedule: weekly on monday
  workflow_dispatch:
tools:
  bash: ["curl", "gh"]
  edit:
  web-fetch:
  github:
    toolsets: [repos]
safe-outputs:
  allowed-domains:
    - github.com
    - docs.github.com
create-pull-request:
  labels: [automated-update, copilot-cli-updates]
  title-prefix: "[bot] "
  base-branch: main
---

# Cheatsheet Updater

You are a maintainer for the **GitHub Copilot CLI Cheatsheet** repository — a visual reference site for Copilot CLI commands. Your job is to check for recent updates to the Copilot CLI and determine if the cheatsheet content needs updating.

## Step 1 — Gather recent Copilot CLI updates

Use `web-fetch` to read the following pages and extract the latest entries from the past 7 days:

- https://github.com/github/copilot-cli/blob/main/changelog.md — CLI changelog

Also use `gh` CLI to check the latest releases and commits in the `github/copilot-cli` repo.

Look for:

- New commands added (e.g. new slash commands like `/newcommand`)
- Existing commands renamed or removed
- Changes to command syntax, subcommands, or flags
- New categories or groupings of commands

## Step 2 — Check for existing open PRs to avoid duplicates

List all open pull requests in this repo that have the `automated-update` or `copilot-cli-updates` labels. Read their titles and descriptions to understand which commands or changes each PR already covers.

Build a list of changes that are **already addressed** by open PRs and exclude them from anything you propose. If every change found in Step 1 is already covered, stop here and report that no new updates are needed.

## Step 3 — Compare against current cheatsheet content

Read all JSON files in `src/data/categories/` — these are the source of truth for what commands are currently documented. Also read `src/types/index.ts` to understand the `Command` type shape and the `CATEGORIES` array.

Identify:

- **Missing commands** — new CLI commands not yet present in any category JSON
- **Outdated commands** — commands that have been renamed, removed, or had their syntax significantly changed
- **Wrong category** — commands that have moved to a different grouping

If nothing is new or everything is already up to date, stop here and report that no updates are needed.

## Step 4 — Update the cheatsheet data

For each change needed, edit the relevant file in `src/data/categories/`.

Follow these conventions exactly (from `AGENTS.md`):

**Adding a new command** — add an entry to the matching category JSON:
```json
{
  "id": "{2-3-letter-prefix}-{n}",
  "title": "/commandname",
  "syntax": "/commandname [ARGS]",
  "description": "One sentence: what it does.",
  "analogy": "Like [familiar concept] — [brief explanation].",
  "examples": [
    "/commandname  # brief inline comment"
  ],
  "category": "category-slug"
}
```

**Adding a new category** — also add a `Category` entry to the `CATEGORIES` array in `src/types/index.ts`.

**Removing a command** — delete the entire JSON entry. Also remove the corresponding entry from `scripts/demos.json` if one exists.

**Renaming / syntax change** — update `title`, `syntax`, and `examples` fields in place. Update `scripts/demos.json` if a demo exists for that command.

Do not add `terminalDemo` fields — those are added separately after GIF recordings are made.
Do not modify any `.tsx`, `.css`, or non-data files unless a new category requires a `CATEGORIES` entry in `src/types/index.ts`.

**Also update `scripts/demos.json`** for every command added or removed:

- **New command** — add a demo entry following the existing pattern:
  ```json
  {
    "id": "commandname",
    "category": "category-slug",
    "description": "Brief description of what the demo shows",
    "command": "/commandname example-arg",
    "responseWait": 10
  }
  ```
  Use `"responseWait": 20` for commands that trigger AI responses, `6` for instant commands.
  If the command requires prior conversation history or opens an interactive TUI, use a `steps` array instead — see existing examples like `/compact` or `/model` in `scripts/demos.json`.

- **Removed command** — delete the matching entry from `scripts/demos.json`.

The `generate-gifs.yml` workflow will automatically detect the change to `scripts/demos.json` on this PR branch and generate the GIF, committing it back to the branch. The PR should not be merged until that workflow completes successfully and the GIF is committed.

## Step 5 — Open a pull request

Create a pull request targeting `main`. The PR title should summarize what changed (e.g., "Add /newcommand to chat category"). The PR body should include:

1. What new features or changes were found (with links to changelog entries)
2. Which JSON files were updated and what changed in each
3. Any commands removed and why (deprecated / renamed)

Apply the labels `automated-update` and `copilot-cli-updates` to the PR.
