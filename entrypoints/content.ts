import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { loadRulesForHost } from '../lib/rules';
import { injectStylesheet, removeStylesheet, startObserver } from '../lib/blocker';
import { getSettings, onSettingsChange } from '../lib/storage';
import type { BlockEvent } from '../lib/messages';

export default defineContentScript({
  matches: ['*://chatgpt.com/*', '*://*.chatgpt.com/*'],
  runAt: 'document_start',
  async main() {
    const hostname = window.location.hostname;
    const rule = loadRulesForHost(hostname);
    if (!rule) return;

    let stopObserver: (() => void) | null = null;

    const sendBlock = (selectorId: string): void => {
      const msg: BlockEvent = {
        type: 'block',
        platform: rule.platform,
        hostname,
        selectorId,
      };
      browser.runtime.sendMessage(msg).catch(() => {
        /* SW may be evicted/loading; non-fatal. */
      });
    };

    const apply = (): void => {
      injectStylesheet(rule);
      stopObserver = startObserver(rule, { onBlock: sendBlock });
    };

    const unapply = (): void => {
      removeStylesheet();
      stopObserver?.();
      stopObserver = null;
    };

    const settings = await getSettings();
    const isWhitelisted = settings.whitelist.includes(hostname);
    if (settings.enabled && !isWhitelisted) {
      apply();
    }

    onSettingsChange((next) => {
      const wl = next.whitelist.includes(hostname);
      const shouldApply = next.enabled && !wl;
      if (shouldApply && !stopObserver) apply();
      else if (!shouldApply && stopObserver) unapply();
    });
  },
});
