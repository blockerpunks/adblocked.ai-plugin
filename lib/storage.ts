import { browser } from 'wxt/browser';

export type Settings = {
  enabled: boolean;
  whitelist: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  whitelist: [],
};

const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch };
  await browser.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

export function onSettingsChange(handler: (settings: Settings) => void): () => void {
  const listener = (
    changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    area: string,
  ): void => {
    if (area !== 'local') return;
    const change = changes[SETTINGS_KEY];
    if (!change) return;
    const next = change.newValue as Settings | undefined;
    if (next) handler({ ...DEFAULT_SETTINGS, ...next });
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
