# [-] Adblocked AI

A browser extension that hides ads in AI chat interfaces, starting with ChatGPT. It runs entirely in your browser, collects no data, and is small enough to read in one sitting.

- **Firefox** (140+ desktop, 142+ Android): [Add from addons.mozilla.org](https://addons.mozilla.org/firefox/addon/adblocked-ai/)
- **Chrome, Brave, Edge**: Web Store listing pending. Until then, download the Chrome zip from [Releases](https://github.com/blockerpunks/adblocked.ai-plugin/releases), unzip it, and load the folder (`chrome://extensions` → Developer mode → Load unpacked).
- **Website**: https://adblocked.ai

## Why this exists

People ask AI assistants for advice: what to buy, where to go, what to believe. Those assistants now show ads next to their answers. On the web you can view source and see what a page is doing. A chat answer gives you nothing to inspect.

Ads are the part of commercial influence you can see, so we started there. This extension hides them.

## How it works today

Adblocked AI is a rule applier. It does not analyze, classify, or read your conversations.

1. **Rules.** [`rules/chatgpt.json`](rules/chatgpt.json) is a short list of CSS selectors that match the ad containers on chatgpt.com. The list is maintained by hand and ships inside the extension. There are two selectors today.
2. **Hiding.** When you open chatgpt.com, the extension adds one stylesheet to the page that sets `display: none` on anything those selectors match.
3. **Counting.** The extension counts how many elements it has hidden and stores that number in your browser so the popup can show it. The count never leaves your device.

That is the whole product. The popup has an on/off switch and the counter. The settings page shows the exact version and commit your copy was built from.

### What it asks for

| Permission              | Why                                             |
| ----------------------- | ----------------------------------------------- |
| `storage`               | Saves your on/off setting and the local counter |
| Access to `chatgpt.com` | Adds the stylesheet that hides ads              |

Nothing else. No access to other sites, no background network access, no remote code.

### What it does not do

We would rather you know the limits than find them.

- **It hides ads; it does not stop them being sent.** The ad is still delivered to your browser and then hidden. If the platform records an impression when it sends the ad, this extension does not prevent that.
- **It does not detect influence inside an answer.** If a model recommends a partner's product in the text of its reply, nothing here catches it. Doing that would mean reading your conversations, which we won't do.
- **It only covers chatgpt.com.** Other assistants are planned. The native mobile and desktop apps are out of reach for any browser extension.
- **Rules can break.** When ChatGPT changes its page structure, a selector can stop matching or match the wrong thing. If you see an ad, or something that isn't an ad goes missing, [tell us](CONTRIBUTING.md#report-an-ad-we-missed-or-something-we-hid-by-mistake).
- **Rules update only with a new release.** There is no remote rule sync yet.

## How we know what to block

**What counts as an ad.** We block what the platform itself labels as advertising: paid placements marked "Ad" or "Sponsored" and shown separately from the answer. We don't judge the content of answers, and we don't block a platform's own upgrade prompts.

**Where the rules come from.** We don't learn from your conversations. We run our own test sessions: automated browsers send [N] sample prompts to ChatGPT from [N] countries [daily/weekly] and save the pages that come back. This runs on separate infrastructure operated by one of our contributors. The extension is not part of it and sends it nothing.

When a saved page contains something ChatGPT labels as an ad, we inspect its markup and write a CSS selector for the element that holds only the ad and its disclaimer.

**What this misses.** Our test sessions are [logged out], so ads shown only to signed-in accounts may reach you before they reach us. Coverage also depends on the prompts and countries we sample. If you see an ad we missed, [report it](CONTRIBUTING.md#report-an-ad-we-missed-or-something-we-hid-by-mistake).

## Check our work

You shouldn't have to trust a tool that claims to protect you. You can verify this one.

- **No data leaves your browser.** Open DevTools → Network, filter to the extension, and use ChatGPT. You will see zero requests from it. The source contains no `fetch`, `XMLHttpRequest`, or analytics calls.
- **The installed build matches the source.** The settings page shows `<version> (<commit SHA>)`. Compare it with the tagged release here.
- **Builds are reproducible.** Node 22, then `npm ci && npm run zip:firefox` (or `npm run zip`).
- **Firefox declares it.** The manifest sets `data_collection_permissions: none`, the declaration Mozilla requires extensions to make about data collection.

## Who we are

Blockerpunks began as a conversation among friends who have spent three decades working where technology meets the public interest: engineers and lawyers, scientists and journalists, authors, artists, organizers, advisors to governments, and people building AI today. Together we've built tools used by millions, helped write and defend the laws that protect digital rights, helped create public institutions and shape policy in many countries, informed award-winning journalism, and taught a generation to understand and question the technology around them. We know what happens when people with different skills pull in the same direction.

We like powerful tools. We use them every day, and some of us help build them, including at frontier AI labs. We believe AI can make life better. We don't think its direction should be decided only by a few companies and their investors. We want the future, and we want a stake in it.

## Contributing

The most useful thing you can do takes five minutes and no code: tell us when you see an ad we missed. Ads vary by country, account type, and week, and we can only write rules for what we've seen.

We also want help with rules for other AI platforms, a Safari build, tests, and translations. See [CONTRIBUTING.md](CONTRIBUTING.md).

Security issues: email blockerpunks@gmail.com instead of opening a public issue.

## Development

Requires Node.js 22+ and npm 10+.

```bash
npm install          # also generates WXT types
npm run dev          # watch build to .output/chrome-mv3-dev/
npm run dev:firefox  # watch build to .output/firefox-mv3/
```

WXT rebuilds on change but does not launch a browser. Load the output directory once:

- Chrome: `chrome://extensions` → Developer mode → Load unpacked
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `manifest.json`

Before opening a pull request:

```bash
npm run validate:rules   # rule file shape and selector syntax
npm run lint
npm run format:check
npm run compile          # type-check
npm run build && npm run build:firefox
```

Architecture and the reasoning behind it are in [`docs/design_decisions.md`](docs/design_decisions.md).

## License

[MIT](LICENSE)
