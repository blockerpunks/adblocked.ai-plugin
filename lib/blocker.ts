import type { Rule } from './rules';

export type BlockerHooks = {
  onBlock: (selectorId: string) => void;
};

const STYLE_ID = 'adblocked-ai-style';

function buildStylesheet(selectors: string[]): string {
  if (selectors.length === 0) return '';
  return `${selectors.join(',\n')} { display: none !important; }`;
}

export function injectStylesheet(rule: Rule): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = buildStylesheet(rule.selectors);
  (document.head ?? document.documentElement).appendChild(style);
  return style;
}

export function removeStylesheet(): void {
  document.getElementById(STYLE_ID)?.remove();
}

export function startObserver(rule: Rule, hooks: BlockerHooks): () => void {
  let pending = false;
  const seen = new WeakSet<Element>();

  const scan = (): void => {
    pending = false;
    for (const selector of rule.selectors) {
      let matches: NodeListOf<Element>;
      try {
        matches = document.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const el of matches) {
        if (seen.has(el)) continue;
        seen.add(el);
        hooks.onBlock(selector);
      }
    }
  };

  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: false,
  });

  requestAnimationFrame(scan);

  return () => observer.disconnect();
}
