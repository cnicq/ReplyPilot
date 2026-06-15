export {
  checkHealth,
  getProfiles,
  createProfile,
  saveProfile,
  deleteProfile,
  seedExampleProfile,
  setDefaultProfile,
  generateReplies,
  lookupCachedReplies,
  addReplyHistory,
  getReplyHistory,
  getDefaultProfileInfo,
  getExtensionConfig,
  saveExtensionConfig,
  getSettings,
  saveSettings,
  getProviders,
} from '../api/client';

export type { ExtensionConfig, AppSettings, ProviderInfo } from '../types';
export { DEFAULT_EXTENSION_CONFIG, DEFAULT_SETTINGS, PROVIDER_DEFAULTS, createEmptyProfile } from '../types';
