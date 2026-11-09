# Design Decisions

This document is the living record of architectural decisions for **adblocked.ai** (codename: Aegis) — the browser extension and the marketing website. Keep it in sync with the code.

---

## 1. Detection strategy: rule applier, not detector

**Decision.** Ad detection is selector-based, with selectors curated externally by the team. The extension is a _modular rule applier_.

**Why.** The team has already captured ad selectors for ChatGPT and will provide more. Investing in detection heuristics, semantic classification, or "soft-match" logic inside the extension would duplicate work and add risk (false positives, fingerprintable signatures, larger attack surface for AI platforms to evade).

**How.**

- `rules/<platform>.json` — versioned selector lists keyed by platform.
- `lib/rules.ts` — maps hostname → platform → bundled rules (`loadRulesForHost`).
- `lib/blocker.ts` — hiding is a single injected `<style>` (`display: none !important`). A rAF-batched MutationObserver on the whole document only _counts_ newly matched elements for the block counter. **Zero detection logic.**

**Out of scope (deliberate).**

- Soft / native in-response ad detection (the model itself recommending a partner product mid-stream). Requires semantic classification that conflicts with the privacy posture.
- Brave Shields detection. No functional overlap — Shields is network-level, this product is cosmetic on first-party DOM.
- Remote rule sync. Bundled rules in v0; remote fetch deferred to v0.1+.

---

## 2. Telemetry posture (v0)

**Decision.** v0 ships **zero outbound telemetry**, with a single `reportBlocked()` seam in the service worker that today writes only to `chrome.storage.local`.

**Why.** Keeps four future tiers achievable in v0.1+ without architectural rework, while preserving the brand's privacy promise on day one. The marketing site states that adblocked.ai runs locally with no analytics or tracking, and the Options page states "No data ever leaves your browser" — v0 honors that literally.

### Tiers considered

#### Tier 0 — Zero telemetry (chosen for v0)

- Counter is local; popup shows the user's own blocked count.
- The marketing site's originally planned "2.3M+ ads blocked monthly" stat cannot be supported under this tier and has been removed.
- **Strongest brand alignment** with the manifesto's privacy stance.
- **Cost:** marketing loses an aggregate growth signal.

#### Tier 1 — Opt-in aggregate ping

- Anonymous UUID generated at install, never linked to user identity.
- Daily flush of `{uuid, blocked_count}` to a logging-disabled endpoint (Cloudflare Worker is the leading candidate).
- Default off, surfaced as a settings toggle.
- **Cost:** small backend; coverage typically 10–30% (volunteer pool); marketing aggregate is real but footnoted as opt-in.

#### Tier 2 — Default-on aggregate

- Same plumbing as Tier 1, enabled by default with opt-out toggle.
- Industry standard for adblockers like AdBlock and Adblock Plus.
- **Cost:** brand-positioning conflict — would force softening the marketing copy from "no data ever leaves your browser" to "no behavioral data, anonymous counts only."

#### Tier 3 — Privacy-preserving aggregation (P3A-style)

- Brave-pioneered protocol; each report is statistically deniable via randomized response.
- Aggregate stays meaningful for large N.
- **Cost:** ~3–5× implementation effort; needs a careful explainer page; strongest defensible privacy story.

### MV3 mechanics that apply to all tiers

- Service workers evict ~30s after idle, so counters live in `chrome.storage.local`, not memory.
- Periodic flushes use `chrome.alarms` (min 30s interval), not `setInterval`.
- Outbound `fetch()` from the SW is unrestricted, but the telemetry host needs to be in `host_permissions`.
- Chrome Web Store / AMO / App Store all require declaring data collection at submission. Anonymized analytics is permitted everywhere with disclosure.

### IP / fingerprinting caveat (Tiers 1–3)

Even an anonymous payload reveals IP + UA at the network layer. To make the privacy promise watertight, the endpoint needs:

- Cloudflare Worker with explicit no-log config, or
- A privacy-preserving proxy.

### Architectural seam

The single function `reportBlocked(platform, hostname, selectorId)` in `lib/counter.ts`, called from the service worker on each `block` message from the content script, is the only telemetry surface. Any future change to telemetry tier should go through this seam — no scattered `fetch()` calls in the content script or SW for analytics.

---

## 3. Stack: WXT + TypeScript, no React in popup/options

**Decision.** WXT (file-based MV3 entrypoints, Vite build, cross-browser output) + TypeScript strict. **No React** in the popup or options pages.

**Why.**

- WXT abstracts manifest generation and the Chrome/Firefox/Safari API differences; this project will eventually target all three.
- TypeScript is non-negotiable for DOM-heavy extensions where runtime errors silently break ad-blocking.
- A toggle and a counter don't justify a UI framework. Vanilla DOM keeps the bundle small and easier to audit, which matters for an open-source privacy tool.
- Popup and options are styled with plain CSS (no Tailwind) for the same reason.

**Trade-off considered.** Plasmo (the original alternative) has had visibly slower release cadence through 2024–2025. WXT has the momentum. Vanilla MV3 + `webextension-polyfill` is also viable but re-implements manifest-per-target builds and Safari packaging — not worth it for a small surface area.

---

## 4. Cross-browser scope

**Decision.** Every release ships Chrome and Firefox. Brave and Edge are Chromium and run the Chrome build (Edge needs only its own store listing when store submission happens).

**Firefox.** Built as MV3 (`wxt -b firefox --mv3`; WXT converts the service worker to a background script). Distributed like Chrome, as a sideloadable file on GitHub Releases: an XPI signed by AMO on the **unlisted** channel, since Firefox release builds refuse unsigned extensions. Gecko ID `extension@adblocked.ai`; `data_collection_permissions: none` (requires Firefox 140 desktop / 142 Android). Chosen ahead of Safari for its larger desktop share and low porting cost.

**Roadmap.**

- Next: Safari macOS (requires Xcode wrapper, Apple Developer account, App Store review).
- **Not on roadmap:** iOS Safari. Safari Web Extensions on iOS can inject CSS, so the blocker would technically work, but mobile ChatGPT usage is overwhelmingly the native app, which no extension reaches.

---

## 5. Distribution and verification

**Decision.** v0 ships as a sideloadable unpacked extension via GitHub Releases. Web Store submission deferred until rules are stable and the rule-update mechanism is in place.

**Status.** Releases are cut by release-please: merging its release PR tags `vX.Y.Z` and publishes a GitHub Release with the built zip attached. Until the first release, the extension is built from source (`npm run build`) and loaded unpacked.

**Open-source verification.** The Options page shows the build as `<manifest version> (<commit SHA>)` so users can verify their installed extension against the tagged release. The SHA comes from the `COMMIT_SHA` env var at build time (`dev` if unset).

---

## 6. Network blocking (declarativeNetRequest)

**Decision.** All blocking is cosmetic today (CSS on first-party DOM), so the `declarativeNetRequest` permission is not requested. Chrome Web Store review rejects unused permissions. If AI platforms start loading ads or trackers from separate servers, add `declarativeNetRequest` to `wxt.config.ts` along with the rulesets that use it.

---

## 7. Marketing website

**Decision.** Astro static site with React islands, Tailwind CSS v3, deployed to GitHub Pages at https://adblocked.ai.

**Why.** A marketing site is static content; Astro ships HTML-first with minimal JS and outputs plain files that GitHub Pages can host with no extra services.

**How.**

- React only where interactivity is needed (currently the FAQ accordion, `client:load`); everything else is `.astro` components.
- Brand palette lives in `website/tailwind.config.js`; dark mode follows the OS (`darkMode: 'media'`).
- The product name is **adblocked.ai**; **Aegis** remains the codename (repo, internal docs).
- No analytics or third-party tracking scripts on the site, consistent with the Tier 0 posture in §2.
- `.github/workflows/deploy.yml` builds and deploys on pushes to `main` that touch `website/**`.

---

## References

- `docs/projectbrief.md` — product brief.
