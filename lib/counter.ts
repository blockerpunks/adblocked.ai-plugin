import { browser } from 'wxt/browser';
import type { Platform } from './messages';

const KEY_TOTAL = 'counter:total';
const KEY_HOST_PREFIX = 'counter:host:';
const KEY_HOST = (host: string): string => `${KEY_HOST_PREFIX}${host}`;

export type CounterSnapshot = {
  total: number;
  perHost: Record<string, number>;
};

/**
 * Telemetry seam. v0 writes only to browser.storage.local; future tiers
 * (opt-in / default-on / P3A) plug in here. See docs/design_decisions.md §2.
 */
export async function reportBlocked(
  _platform: Platform,
  hostname: string,
  _selectorId: string,
): Promise<void> {
  const totalKey = KEY_TOTAL;
  const hostKey = KEY_HOST(hostname);
  const current = await browser.storage.local.get([totalKey, hostKey]);
  const total = (current[totalKey] as number | undefined) ?? 0;
  const host = (current[hostKey] as number | undefined) ?? 0;
  await browser.storage.local.set({
    [totalKey]: total + 1,
    [hostKey]: host + 1,
  });
}

export async function getCounters(): Promise<CounterSnapshot> {
  const all = await browser.storage.local.get(null);
  let total = 0;
  const perHost: Record<string, number> = {};
  for (const [key, value] of Object.entries(all)) {
    if (key === KEY_TOTAL) {
      total = (value as number | undefined) ?? 0;
    } else if (key.startsWith(KEY_HOST_PREFIX)) {
      const host = key.slice(KEY_HOST_PREFIX.length);
      perHost[host] = (value as number | undefined) ?? 0;
    }
  }
  return { total, perHost };
}

export async function resetCounters(): Promise<void> {
  const all = await browser.storage.local.get(null);
  const keys = Object.keys(all).filter(
    (k) => k === KEY_TOTAL || k.startsWith(KEY_HOST_PREFIX),
  );
  if (keys.length > 0) {
    await browser.storage.local.remove(keys);
  }
}
