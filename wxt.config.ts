import { defineConfig } from 'wxt';

const COMMIT_SHA = process.env.COMMIT_SHA ?? 'dev';

export default defineConfig({
  srcDir: '.',
  manifest: {
    name: 'adblocked.ai',
    description: 'Block ads in AI chat interfaces.',
    version: '0.0.1',
    permissions: ['storage', 'alarms', 'declarativeNetRequest'],
    host_permissions: ['*://chatgpt.com/*', '*://*.chatgpt.com/*'],
  },
  vite: () => ({
    define: {
      __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
    },
  }),
});
