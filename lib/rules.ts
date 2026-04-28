import chatgptRules from '../rules/chatgpt.json';
import type { Platform } from './messages';

export type Rule = {
  platform: Platform;
  version: number;
  selectors: string[];
};

const PLATFORM_BY_HOST: Record<string, Platform> = {
  'chatgpt.com': 'chatgpt',
};

const RULES_BY_PLATFORM: Record<Platform, Rule> = {
  chatgpt: chatgptRules as Rule,
};

export function loadRulesForHost(hostname: string): Rule | null {
  const cleaned = hostname.replace(/^www\./, '');
  for (const host of Object.keys(PLATFORM_BY_HOST)) {
    if (cleaned === host || cleaned.endsWith(`.${host}`)) {
      const platform = PLATFORM_BY_HOST[host];
      if (!platform) continue;
      return RULES_BY_PLATFORM[platform];
    }
  }
  return null;
}
