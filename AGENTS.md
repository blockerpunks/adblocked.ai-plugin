# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Overview

Browser extension for **adblocked.ai**: blocks ads in cloud AI chat interfaces, starting with ChatGPT. MV3 extension built with WXT + TypeScript strict, no React. The marketing site lives in a separate repo (`blockerpunks/adblocked.ai-site`).

- `docs/` — product brief and design decisions. `docs/design_decisions.md` is the authoritative source for architecture choices.

Node 22+, npm 10+.

## Commands

- `npm install` — also runs `wxt prepare` (generates `.wxt/` types)
- `npm run dev` — watch build to `.output/chrome-mv3-dev/`; load it unpacked via chrome://extensions, then open chatgpt.com (no auto-launched browser: the optional `web-ext` peer is intentionally not installed because it pulls in vulnerable deps)
- `npm run compile` — type-check (`tsc --noEmit`)
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm run validate:rules` — checks `rules/*.json` shape and selector syntax
- `npm run build` — output in `.output/chrome-mv3/` (load unpacked via chrome://extensions)
- `npm run zip` — packaged build
- Firefox: `npm run dev:firefox` / `build:firefox` / `zip:firefox` (output in `.output/firefox-mv3/`; load via about:debugging → This Firefox → Load Temporary Add-on → `manifest.json`). Release builds are signed on AMO's unlisted channel in `release.yml` via a pinned `npx web-ext` (still not a dependency).
- `COMMIT_SHA` env var is injected at build time as the `__COMMIT_SHA__` global (defaults to `dev`).

There is no test suite.

## Releases

The extension is versioned with semver.

- release-please (`.github/workflows/release.yml`, `release-please-config.json`) derives the next version from conventional commits (`fix:` → patch, `feat:` → minor; breaking → minor while < 1.0) and keeps a release PR open. Merging it tags `vX.Y.Z`, creates the GitHub Release, and attaches the built Chrome zip and signed Firefox XPI.
- Signing needs the `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repo secrets.
- Never edit versions by hand. `package.json` is the single source of truth; do not set `version` in `wxt.config.ts` (WXT reads it from `package.json`).
- No pre-release suffixes (`-beta.1`): Chrome manifest versions must be dot-separated integers.

## Architecture

The extension is a **rule applier, not a detector** — do not add detection heuristics or semantic classification. Ad selectors are curated externally by the team and bundled as JSON.

Flow:

1. `entrypoints/content.ts` (runs at `document_start` on chatgpt.com) calls `lib/rules.ts#loadRulesForHost` to map hostname → `Platform` → `rules/<platform>.json`.
2. If settings allow (`lib/storage.ts`: `enabled` flag + hostname `whitelist` in `browser.storage.local`), `lib/blocker.ts` injects a single `<style id="adblocked-ai-style">` hiding all selectors with `display: none !important`, and starts a rAF-throttled `MutationObserver` that only _counts_ newly matched elements (hiding is done purely by CSS).
3. Each new match sends a `BlockEvent` message (`lib/messages.ts`) to `entrypoints/background.ts`, which calls `lib/counter.ts#reportBlocked` to increment `counter:total` and `counter:host:<host>` in storage.
4. Popup/options (`entrypoints/popup`, `entrypoints/options`) are plain TS + DOM, reading/writing the same storage keys and reacting via `onSettingsChange`.

Adding a platform requires touching: a new `rules/<platform>.json`, the `Platform` union in `lib/messages.ts`, `PLATFORM_BY_HOST`/`RULES_BY_PLATFORM` in `lib/rules.ts`, `host_permissions` in `wxt.config.ts`, and `matches` in `entrypoints/content.ts`.

Key constraints (from `docs/design_decisions.md`):

- **Zero outbound telemetry in v0.** The marketing site promises no data leaves the browser. `reportBlocked()` in `lib/counter.ts` is the _only_ telemetry seam — never add `fetch()` calls elsewhere for analytics.
- MV3 service workers are evicted when idle: keep state in `browser.storage.local`, not memory; use `chrome.alarms`, not `setInterval`.
- Bundled rules only; remote rule sync is deferred.
- Use `browser` from `wxt/browser`, not the `chrome` global.

## CI

`.github/workflows/ci.yml` runs validate:rules, lint, format:check, compile and the Chrome and Firefox builds on PRs and pushes to `main`.
