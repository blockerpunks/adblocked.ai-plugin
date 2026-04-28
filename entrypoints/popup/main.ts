import { browser } from 'wxt/browser';
import { getSettings, setSettings, onSettingsChange } from '../../lib/storage';
import { getCounters } from '../../lib/counter';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

async function getActiveHostname(): Promise<string | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    return new URL(tab.url).hostname;
  } catch {
    return null;
  }
}

async function render(): Promise<void> {
  const [settings, counters, host] = await Promise.all([
    getSettings(),
    getCounters(),
    getActiveHostname(),
  ]);

  $<HTMLInputElement>('enabled-toggle').checked = settings.enabled;
  $<HTMLSpanElement>('counter-total').textContent = counters.total.toLocaleString();

  const hostLabel = $<HTMLSpanElement>('counter-host-label');
  const hostNumber = $<HTMLSpanElement>('counter-host');
  if (host && counters.perHost[host] !== undefined) {
    hostNumber.textContent = counters.perHost[host].toLocaleString();
    hostLabel.textContent = `on ${host}`;
  } else if (host) {
    hostNumber.textContent = '0';
    hostLabel.textContent = `on ${host}`;
  } else {
    hostNumber.textContent = '0';
    hostLabel.textContent = 'on this site';
  }
}

function bindEvents(): void {
  $<HTMLInputElement>('enabled-toggle').addEventListener('change', (e) => {
    const checked = (e.currentTarget as HTMLInputElement).checked;
    void setSettings({ enabled: checked });
  });

  $<HTMLAnchorElement>('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });

  onSettingsChange(() => {
    void render();
  });
}

bindEvents();
void render();
