import { defineConfig } from 'wxt';

const COMMIT_SHA = process.env.COMMIT_SHA ?? 'dev';

export default defineConfig({
  srcDir: '.',
  manifest: ({ browser }) => ({
    name: 'adblocked.ai',
    description: 'Block ads in AI chat interfaces.',
    permissions: ['storage'],
    host_permissions: ['*://chatgpt.com/*', '*://*.chatgpt.com/*'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'extension@adblocked.ai',
          // data_collection_permissions needs Firefox 140 desktop / 142 Android.
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
        gecko_android: {
          strict_min_version: '142.0',
        },
      },
    }),
  }),
  vite: () => ({
    define: {
      __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
    },
  }),
});
