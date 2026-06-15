import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'ReplyPilot',
  description:
    'Persona-aware AI reply assistant — learn to reply as your account, not as generic AI.',
  version: packageJson.version,
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_title: 'ReplyPilot',
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: [
    'https://www.xiaohongshu.com/*',
    'http://localhost:7800/*',
    'http://127.0.0.1:7800/*',
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.xiaohongshu.com/*'],
      js: ['src/content/index.ts'],
      css: ['src/content/content.css'],
    },
  ],
});
