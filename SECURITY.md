# Security Policy

## Supported Versions

This project is a static single-page application deployed to GitHub Pages. There is no server, no database, and no user authentication. Only the latest version published to the `main` branch is actively maintained.

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Older commits | ❌ |

---

## Scope

Because this is a fully client-side, read-only reference site with no backend, the attack surface is limited. Security concerns relevant to this project include:

- **Dependency vulnerabilities** — npm packages pulled in via `package.json` (React, Vite, Fuse.js, etc.)
- **Cross-site scripting (XSS)** — unsafe rendering of user-supplied or data-driven content in the React UI
- **Supply chain attacks** — compromised transitive dependencies or build tooling
- **Sensitive data exposure** — accidental inclusion of secrets, tokens, or credentials in source or build output

Out-of-scope issues (we cannot act on them):
- GitHub Pages infrastructure or CDN vulnerabilities
- Vulnerabilities in the user's browser or OS
- Social engineering attacks unrelated to this codebase

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities privately using one of the following methods:

1. **GitHub Private Vulnerability Reporting** *(preferred)* — open a draft advisory at [Security Advisories](https://github.com/prasadhonrao/ghcp-cli-cheatsheet/security/advisories). GitHub keeps the report confidential until a fix is released.
2. **Email** — if you prefer, contact the maintainer directly. Find the email address in the [GitHub profile](https://github.com/prasadhonrao).

### What to include

A useful report contains:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce, or a proof-of-concept (PoC)
- The affected file(s) or dependency name and version
- Any suggested remediation, if known

### Response timeline

| Stage | Target timeframe |
|---|---|
| Acknowledgement of report | Within 48 hours |
| Initial assessment (in-scope / severity) | Within 5 business days |
| Fix or mitigation published | Dependent on severity (see below) |

| Severity | Target fix timeline |
|---|---|
| Critical / High | Within 7 days |
| Medium | Within 30 days |
| Low / Informational | Next regular release |

---

## Dependency Security

Dependencies are the primary risk surface for this project. To stay on top of them:

- **`npm audit`** — run locally to check for known vulnerabilities in the dependency tree.
- **Dependabot** — automated pull requests are opened for vulnerable or outdated packages (configured in `.github/dependabot.yml` if present).
- Before adding a new dependency, prefer packages that are widely used, actively maintained, and have a minimal transitive dependency footprint.

To audit locally:

```bash
npm audit
npm audit fix   # apply non-breaking fixes automatically
```

---

## Secure Development Practices

### No secrets in source

This repository contains no API keys, tokens, or credentials. If you spot one accidentally committed:

1. Rotate or revoke the credential immediately — treat it as compromised.
2. Report it via the private channel above so it can be purged from git history.

Never add secrets to source files, `.env` files committed to the repo, or build output.

### Dependency hygiene

- Pin devDependencies to minor versions (e.g., `"^1.2.0"`) rather than loose major ranges where practical.
- Review changelogs before upgrading major versions of React, Vite, or TypeScript.
- Avoid dependencies that pull in large, poorly-maintained transitive trees.

### Content Security

All command data is static JSON bundled at build time. There is no runtime user-generated content written to the DOM. React's default JSX escaping protects against XSS in rendered data — do not use `dangerouslySetInnerHTML` anywhere in this codebase.

---

## Disclosure Policy

This project follows **coordinated disclosure**:

1. Reporter submits a private report.
2. Maintainer acknowledges, assesses, and works on a fix.
3. Fix is merged and deployed.
4. A public security advisory is published crediting the reporter (unless they prefer to remain anonymous).

We ask reporters to give us a reasonable window to fix the issue before any public disclosure.
