# Overview

adblocked.ai (codename: Aegis) is an ad-blocker for AI products, starting with chatgpt.com.

# MVP capabilities

Browser extension that hides known advertising elements on https://chatgpt.com using selectors curated by the team.

# Marketing website

Built first, at https://adblocked.ai. It explains why the product exists and gives install instructions; Chrome Web Store distribution is not live yet.

## Technical choices

- The website is built with Astro, React islands and Tailwind CSS. The look and feel matters: it should be modern, responsive and uncluttered.
- The extension is built with WXT and TypeScript (Manifest V3).

See `docs/design_decisions.md` for the rationale.
