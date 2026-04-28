import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { reportBlocked } from '../lib/counter';
import type { RuntimeMessage } from '../lib/messages';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isRuntimeMessage(message)) {
      sendResponse({ ok: false, error: 'unknown message' });
      return false;
    }
    if (message.type === 'block') {
      reportBlocked(message.platform, message.hostname, message.selectorId)
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
    return false;
  });
});

function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { type?: unknown };
  return v.type === 'block';
}
