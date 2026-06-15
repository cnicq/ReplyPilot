export type Platform = 'xiaohongshu' | 'bilibili' | 'x' | 'zhihu' | 'generic';
export type Language = 'zh-CN' | 'en' | 'fr' | 'auto';
export type ReplyLength = 'short' | 'medium' | 'long';
export type AIProvider = 'openai' | 'deepseek' | 'mimo' | 'qwen' | 'custom';
export type ReplyHistoryAction = 'generated' | 'copied' | 'saved' | 'edited';

export type ReplyExample = {
  comment: string;
  reply: string;
};

export type SocialProfile = {
  id: string;
  name: string;
  platform: Platform;
  accountName: string;
  accountDescription: string;
  creatorBackground: string;
  contentPurpose: string;
  targetAudience: string;
  persona: string;
  writingDna: string;
  replyVoiceGuide: string;
  tone: string[];
  communicationStyle: string[];
  preferredTopics: string[];
  avoidTopics: string[];
  forbiddenPhrases: string[];
  replyPrinciples: string[];
  language: Language;
  defaultReplyLength: ReplyLength;
  examples: ReplyExample[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReplyHistoryItem = {
  id: string;
  profileId: string;
  platform: string;
  sourceComment: string;
  generatedReplies: string[];
  selectedReply?: string;
  editedReply?: string;
  action: ReplyHistoryAction;
  pageUrl?: string;
  createdAt: string;
};

export type GeneratedReply = {
  type: 'sincere' | 'restrained' | 'reflective';
  text: string;
};

export type GenerateRepliesRequest = {
  sourceComment: string;
  pageUrl?: string;
};

export type GenerateRepliesResponse = {
  replies: GeneratedReply[];
  profileId: string;
  profileName: string;
};

export type ExtensionConfig = {
  apiBaseUrl: string;
};

export type AppSettings = {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxHistoryExamples: number;
};

export type ProviderInfo = {
  id: AIProvider;
  label: string;
  baseUrl: string;
  model: string;
};

export type LookupCachedRepliesRequest = {
  sourceComment: string;
};

export type LookupCachedRepliesResponse = {
  found: boolean;
  replies?: GeneratedReply[];
  profileId?: string;
  profileName?: string;
};

export type MessageType =
  | { type: 'GENERATE_REPLIES'; payload: GenerateRepliesRequest }
  | { type: 'LOOKUP_CACHED_REPLIES'; payload: LookupCachedRepliesRequest }
  | { type: 'SAVE_REPLY_HISTORY'; payload: Omit<ReplyHistoryItem, 'id' | 'createdAt'> }
  | { type: 'GET_DEFAULT_PROFILE' };

export const DEFAULT_API_PORT = 7800;

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  apiBaseUrl: `http://localhost:${DEFAULT_API_PORT}`,
};

export const PROVIDER_DEFAULTS: Record<AIProvider, { baseUrl: string; model: string; label: string }> = {
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  mimo: { label: 'MiMo', baseUrl: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5-pro' },
  qwen: { label: 'Qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  custom: { label: 'Custom', baseUrl: '', model: '' },
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'mimo',
  apiKey: '',
  baseUrl: PROVIDER_DEFAULTS.mimo.baseUrl,
  model: PROVIDER_DEFAULTS.mimo.model,
  maxHistoryExamples: 15,
};

export function createEmptyProfile(): Omit<SocialProfile, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> {
  return {
    name: '',
    platform: 'xiaohongshu',
    accountName: '',
    accountDescription: '',
    creatorBackground: '',
    contentPurpose: '',
    targetAudience: '',
    persona: '',
    writingDna: '',
    replyVoiceGuide: '',
    tone: [],
    communicationStyle: [],
    preferredTopics: [],
    avoidTopics: [],
    forbiddenPhrases: [],
    replyPrinciples: [],
    language: 'zh-CN',
    defaultReplyLength: 'short',
    examples: [],
  };
}
