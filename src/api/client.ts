import type {
  AppSettings,
  GenerateRepliesRequest,
  GenerateRepliesResponse,
  LookupCachedRepliesResponse,
  ProviderInfo,
  ReplyHistoryItem,
  SocialProfile,
} from '../types';
import { DEFAULT_EXTENSION_CONFIG, type ExtensionConfig } from '../types';

const CONFIG_KEY = 'extensionConfig';

export async function getExtensionConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return { ...DEFAULT_EXTENSION_CONFIG, ...(result[CONFIG_KEY] as Partial<ExtensionConfig>) };
}

export async function saveExtensionConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
}

async function baseUrl(): Promise<string> {
  return (await getExtensionConfig()).apiBaseUrl.replace(/\/$/, '');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${await baseUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? detail;
      if (Array.isArray(detail)) {
        detail = detail
          .map((d: { msg?: string; loc?: (string | number)[] }) => {
            const field = d.loc?.slice(-1)[0];
            return field ? `${String(field)}: ${d.msg ?? '无效'}` : (d.msg ?? '无效');
          })
          .join('；');
      }
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : '请求失败');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

function toApiProfile(
  profile: Partial<SocialProfile> & Pick<SocialProfile, 'name' | 'platform'>
) {
  return {
    name: profile.name,
    platform: profile.platform,
    account_name: profile.accountName ?? '',
    account_description: profile.accountDescription ?? '',
    creator_background: profile.creatorBackground ?? '',
    content_purpose: profile.contentPurpose ?? '',
    target_audience: profile.targetAudience ?? '',
    persona: profile.persona ?? '',
    writing_dna: profile.writingDna ?? '',
    reply_voice_guide: profile.replyVoiceGuide ?? '',
    tone: profile.tone ?? [],
    communication_style: profile.communicationStyle ?? [],
    preferred_topics: profile.preferredTopics ?? [],
    avoid_topics: profile.avoidTopics ?? [],
    forbidden_phrases: profile.forbiddenPhrases ?? [],
    reply_principles: profile.replyPrinciples ?? [],
    language: profile.language ?? 'zh-CN',
    default_reply_length: profile.defaultReplyLength ?? 'short',
    examples: profile.examples ?? [],
    is_default: profile.isDefault ?? false,
  };
}

function fromApiProfile(raw: Record<string, unknown>): SocialProfile {
  return {
    id: String(raw.id),
    name: String(raw.name),
    platform: raw.platform as SocialProfile['platform'],
    accountName: String(raw.account_name ?? ''),
    accountDescription: String(raw.account_description ?? ''),
    creatorBackground: String(raw.creator_background ?? ''),
    contentPurpose: String(raw.content_purpose ?? ''),
    targetAudience: String(raw.target_audience ?? ''),
    persona: String(raw.persona ?? ''),
    writingDna: String(raw.writing_dna ?? ''),
    replyVoiceGuide: String(raw.reply_voice_guide ?? ''),
    tone: (raw.tone as string[]) ?? [],
    communicationStyle: (raw.communication_style as string[]) ?? [],
    preferredTopics: (raw.preferred_topics as string[]) ?? [],
    avoidTopics: (raw.avoid_topics as string[]) ?? [],
    forbiddenPhrases: (raw.forbidden_phrases as string[]) ?? [],
    replyPrinciples: (raw.reply_principles as string[]) ?? [],
    language: (raw.language as SocialProfile['language']) ?? 'zh-CN',
    defaultReplyLength: (raw.default_reply_length as SocialProfile['defaultReplyLength']) ?? 'short',
    examples: (raw.examples as SocialProfile['examples']) ?? [],
    isDefault: Boolean(raw.is_default),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
  };
}

export async function checkHealth(): Promise<{ status: string; database: string }> {
  return request('/health');
}

export async function getProfiles(): Promise<SocialProfile[]> {
  const data = await request<Record<string, unknown>[]>('/profiles');
  return data.map(fromApiProfile);
}

export async function createProfile(
  data: Omit<SocialProfile, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>
): Promise<SocialProfile> {
  const result = await request<Record<string, unknown>>('/profiles', {
    method: 'POST',
    body: JSON.stringify(toApiProfile(data)),
  });
  return fromApiProfile(result);
}

export async function saveProfile(
  profile: Omit<SocialProfile, 'createdAt' | 'updatedAt'>
): Promise<SocialProfile> {
  const result = await request<Record<string, unknown>>(`/profiles/${profile.id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiProfile(profile)),
  });
  return fromApiProfile(result);
}

export async function setDefaultProfile(id: string): Promise<SocialProfile> {
  const profiles = await getProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) throw new Error('Profile not found');
  return saveProfile({ ...profile, isDefault: true });
}

export async function deleteProfile(id: string): Promise<void> {
  await request<void>(`/profiles/${id}`, { method: 'DELETE' });
}

export async function seedExampleProfile(): Promise<SocialProfile> {
  const result = await request<Record<string, unknown>>('/profiles/seed-example', {
    method: 'POST',
  });
  return fromApiProfile(result);
}

function fromApiHistory(raw: Record<string, unknown>): ReplyHistoryItem {
  return {
    id: String(raw.id),
    profileId: String(raw.profile_id),
    platform: String(raw.platform),
    sourceComment: String(raw.source_comment),
    generatedReplies: (raw.generated_replies as string[]) ?? [],
    selectedReply: raw.selected_reply ? String(raw.selected_reply) : undefined,
    editedReply: raw.edited_reply ? String(raw.edited_reply) : undefined,
    action: raw.action as ReplyHistoryItem['action'],
    pageUrl: raw.page_url ? String(raw.page_url) : undefined,
    createdAt: String(raw.created_at),
  };
}

export async function getReplyHistory(limit = 30): Promise<ReplyHistoryItem[]> {
  const data = await request<Record<string, unknown>[]>(`/reply-history?limit=${limit}`);
  return data.map(fromApiHistory);
}

export async function lookupCachedReplies(
  sourceComment: string
): Promise<LookupCachedRepliesResponse> {
  const params = new URLSearchParams({ source_comment: sourceComment.trim() });
  const data = await request<Record<string, unknown>>(`/reply-history/lookup?${params}`);
  return {
    found: Boolean(data.found),
    replies: (data.replies as GenerateRepliesResponse['replies']) ?? [],
    profileId: data.profile_id ? String(data.profile_id) : undefined,
    profileName: data.profile_name ? String(data.profile_name) : undefined,
  };
}

export async function generateReplies(
  payload: GenerateRepliesRequest
): Promise<GenerateRepliesResponse> {
  const data = await request<Record<string, unknown>>('/replies/generate', {
    method: 'POST',
    body: JSON.stringify({
      source_comment: payload.sourceComment,
      page_url: payload.pageUrl,
    }),
  });
  return {
    replies: (data.replies as GenerateRepliesResponse['replies']) ?? [],
    profileId: String(data.profile_id ?? ''),
    profileName: String(data.profile_name ?? ''),
  };
}

export async function addReplyHistory(
  item: Omit<ReplyHistoryItem, 'id' | 'createdAt'>
): Promise<ReplyHistoryItem> {
  const result = await request<Record<string, unknown>>('/reply-history', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: item.profileId,
      platform: item.platform,
      source_comment: item.sourceComment,
      generated_replies: item.generatedReplies,
      selected_reply: item.selectedReply,
      edited_reply: item.editedReply,
      action: item.action,
      page_url: item.pageUrl,
    }),
  });
  return {
    id: String(result.id),
    profileId: String(result.profile_id),
    platform: String(result.platform),
    sourceComment: String(result.source_comment),
    generatedReplies: (result.generated_replies as string[]) ?? [],
    selectedReply: result.selected_reply ? String(result.selected_reply) : undefined,
    editedReply: result.edited_reply ? String(result.edited_reply) : undefined,
    action: result.action as ReplyHistoryItem['action'],
    pageUrl: result.page_url ? String(result.page_url) : undefined,
    createdAt: String(result.created_at),
  };
}

export async function getDefaultProfileInfo(): Promise<{ id: string; name: string } | null> {
  const profiles = await getProfiles();
  const profile = profiles.find((p) => p.isDefault);
  return profile ? { id: profile.id, name: profile.name } : null;
}

function fromApiSettings(raw: Record<string, unknown>): AppSettings {
  return {
    provider: (raw.provider as AppSettings['provider']) ?? 'mimo',
    apiKey: String(raw.api_key ?? ''),
    baseUrl: String(raw.base_url ?? ''),
    model: String(raw.model ?? ''),
    maxHistoryExamples: Number(raw.max_history_examples ?? 15),
  };
}

function toApiSettings(settings: AppSettings) {
  return {
    provider: settings.provider,
    api_key: settings.apiKey,
    base_url: settings.baseUrl,
    model: settings.model,
    max_history_examples: settings.maxHistoryExamples,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const data = await request<Record<string, unknown>>('/settings');
  return fromApiSettings(data);
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const data = await request<Record<string, unknown>>('/settings', {
    method: 'PUT',
    body: JSON.stringify(toApiSettings(settings)),
  });
  return fromApiSettings(data);
}

export async function getProviders(): Promise<ProviderInfo[]> {
  const data = await request<Record<string, unknown>[]>('/settings/providers');
  return data.map((p) => ({
    id: p.id as ProviderInfo['id'],
    label: String(p.label),
    baseUrl: String(p.base_url),
    model: String(p.model),
  }));
}
