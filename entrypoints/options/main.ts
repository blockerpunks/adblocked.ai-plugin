import { browser } from 'wxt/browser';
import { getSettings, setSettings, onSettingsChange } from '../../lib/storage';
import { getCounters, resetCounters } from '../../lib/counter';

declare const __COMMIT_SHA__: string;

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

function normalizeHost(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('://')) return new URL(trimmed).hostname;
    return new URL(`https://${trimmed}`).hostname;
  } catch {
    return null;
  }
}

async function renderWhitelist(): Promise<void> {
  const list = $<HTMLUListElement>('whitelist-list');
  const settings = await getSettings();
  list.innerHTML = '';
  for (const host of settings.whitelist) {
    const li = document.createElement('li');
    li.textContent = host;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      void (async () => {
        const current = await getSettings();
        await setSettings({
          whitelist: current.whitelist.filter((h) => h !== host),
        });
      })();
    });
    li.appendChild(remove);
    list.appendChild(li);
  }
}

async function renderCounter(): Promise<void> {
  const counters = await getCounters();
  $<HTMLSpanElement>('counter-total').textContent = counters.total.toLocaleString();
}

function renderBuildInfo(): void {
  const info = $<HTMLElement>('build-info');
  const version = browser.runtime.getManifest().version;
  info.textContent = `${version} (${__COMMIT_SHA__})`;
}

function bindEvents(): void {
  const form = $<HTMLFormElement>('whitelist-form');
  const input = $<HTMLInputElement>('whitelist-input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void (async () => {
      const host = normalizeHost(input.value);
      if (!host) return;
      const current = await getSettings();
      if (current.whitelist.includes(host)) {
        input.value = '';
        return;
      }
      await setSettings({ whitelist: [...current.whitelist, host] });
      input.value = '';
    })();
  });

  $<HTMLButtonElement>('reset-counter').addEventListener('click', () => {
    if (!confirm('Reset all blocked-ad counters to zero?')) return;
    void resetCounters().then(renderCounter);
  });

  onSettingsChange(() => {
    void renderWhitelist();
  });

  browser.storage.onChanged.addListener((_changes: unknown, area: string) => {
    if (area === 'local') void renderCounter();
  });
}

renderBuildInfo();
bindEvents();
void renderWhitelist();
void renderCounter();
