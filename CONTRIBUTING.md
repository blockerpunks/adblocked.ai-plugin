# Contributing to Adblocked AI

Thanks for being here. This project is small on purpose, and most of the work that matters is keeping the rules accurate. You don't need to write code to help.

## Report an ad we missed, or something we hid by mistake

This is the most valuable contribution. Ads differ by country, account type, and date, so we only know about the formats we've personally seen.

[Open an issue](https://github.com/blockerpunks/adblocked.ai-plugin/issues/new) with:

- **What happened**: an ad was shown, or real content disappeared
- **A screenshot** of the ad or the gap
- **The HTML of the element**: right-click it → Inspect → right-click the highlighted node → Copy → Copy outerHTML
- **Date, country, and account type** (logged out, free, or a paid plan)
- **Browser and extension version** (shown in the extension's settings page)

**Remove anything private first.** Crop the screenshot to the ad and delete your prompt and the answer text from the HTML. We need the structure around the ad, not your conversation.

## Fix or add a rule

Rules live in `rules/<platform>.json` as CSS selectors.

- Prefer selectors tied to something stable and meaningful (a label, a role, an attribute) over long structural chains, which break when the page changes and can match the wrong thing.
- Check for false positives: browse normally with your rule on, including shared links, search results, images, and the sidebar.
- In the pull request, say what the selector targets and include a before/after screenshot.
- Run `npm run validate:rules`.

## Add another AI platform

Open an issue first so we can agree on scope. A new platform touches five places:

1. `rules/<platform>.json`
2. The `Platform` type in `lib/messages.ts`
3. `PLATFORM_BY_HOST` and `RULES_BY_PLATFORM` in `lib/rules.ts`
4. `host_permissions` in `wxt.config.ts`
5. `matches` in `entrypoints/content.ts`

Each new host permission is a new thing users have to trust us with, so we add them one at a time and only with working rules.

## Other things we'd welcome

- **Tests.** There is no test suite yet. Fixture-based tests for rules (saved HTML in, expected hidden elements out) would be a good start.
- **Safari.** A macOS Safari build is next on the roadmap.
- **Translations** of the extension UI and store listings.
- **Documentation**, including corrections to anything here that's unclear or out of date.

## What we won't merge

These are fixed commitments, not preferences. If you think one should change, open an issue to discuss it before writing code.

- **Anything that sends data off the device.** No telemetry, analytics, crash reporting, or network requests of any kind.
- **Remotely loaded code.** Everything the extension runs ships in the reviewed release. Rules are bundled too for now; updating them between releases is something we may add, so talk to us before building it.
- **Reading or classifying conversation content.** The extension applies rules; it does not inspect what you or the model say.
- **Broader permissions** than a change strictly requires.
- **Runtime dependencies** without a strong reason. The code should stay small enough to audit.

## Pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, `docs:`, `chore:`). Releases and the changelog are generated from them.
- Don't edit version numbers or `CHANGELOG.md` by hand.
- CI must pass: `validate:rules`, `lint`, `format:check`, `compile`, and both browser builds.
- Keep changes focused. One rule fix per pull request is ideal.

Setup instructions are in the [README](README.md#development).

## Security

Please don't open public issues for security problems. Email blockerpunks@gmail.com and we'll respond as quickly as we can.

## Conduct

Be direct, be kind, and assume good faith. We're a small group of volunteers and we want this to be a project people enjoy working on.
