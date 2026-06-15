import { useCallback, useEffect, useState } from 'react';
import {
  checkHealth,
  createProfile,
  deleteProfile,
  getExtensionConfig,
  getProfiles,
  getReplyHistory,
  getSettings,
  saveExtensionConfig,
  saveProfile,
  saveSettings,
  seedExampleProfile,
  setDefaultProfile,
} from '../storage';
import type { AppSettings, ExtensionConfig, ReplyHistoryItem, SocialProfile } from '../types';
import { DEFAULT_SETTINGS, createEmptyProfile } from '../types';
import HistoryList from './components/HistoryList';
import ProfileForm from './components/ProfileForm';
import ProfileList from './components/ProfileList';
import SettingsPanel from './components/SettingsPanel';

type Tab = 'profiles' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [history, setHistory] = useState<ReplyHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [extensionConfig, setExtensionConfig] = useState<ExtensionConfig | null>(null);
  const [backendStatus, setBackendStatus] = useState<'ok' | 'error' | 'loading'>('loading');
  const [editing, setEditing] = useState<SocialProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setBackendStatus('loading');
    try {
      const extConfig = await getExtensionConfig();
      setExtensionConfig(extConfig);
      const health = await checkHealth();
      setBackendStatus(health.database === 'ok' ? 'ok' : 'error');
      const [p, s, h] = await Promise.all([getProfiles(), getSettings(), getReplyHistory()]);
      setProfiles(p);
      setSettings(s);
      setHistory(h);
    } catch (err) {
      setBackendStatus('error');
      setLoadError(err instanceof Error ? err.message : '无法连接本地后端');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetDefault = async (id: string) => {
    await setDefaultProfile(id);
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    await load();
  };

  const handleSeedExample = async () => {
    await seedExampleProfile();
    await load();
  };

  const handleSaveProfile = async (
    data: Omit<SocialProfile, 'createdAt' | 'updatedAt'>
  ) => {
    if (data.id) {
      await saveProfile(data);
    } else {
      const { id: _id, isDefault: _d, ...rest } = data as SocialProfile;
      await createProfile(rest);
    }
    setEditing(null);
    setCreating(false);
    await load();
  };

  const handleSaveExtensionConfig = async (config: ExtensionConfig) => {
    await saveExtensionConfig(config);
    await load();
  };

  const handleSaveSettings = async (s: AppSettings) => {
    await saveSettings(s);
    await load();
  };

  if (!extensionConfig) {
    return (
      <div className="app">
        <header className="header"><h1>ReplyPilot</h1></header>
        <div className="content"><p style={{ color: '#999', fontSize: 13 }}>连接本地后端中…</p></div>
      </div>
    );
  }

  if (editing || creating) {
    const initial = editing ?? {
      ...createEmptyProfile(),
      id: '',
      isDefault: false,
      createdAt: '',
      updatedAt: '',
    };
    return (
      <div className="app">
        <header className="header">
          <h1>{creating ? '新建 Profile' : '编辑 Profile'}</h1>
        </header>
        <div className="content">
          <ProfileForm
            initial={initial}
            onSave={handleSaveProfile}
            onCancel={() => { setEditing(null); setCreating(false); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>ReplyPilot</h1>
        <p>每个账号，都有自己的声音</p>
      </header>

      {backendStatus === 'error' && (
        <div className="alert alert-warning" style={{ margin: '8px 16px 0', borderRadius: 8 }}>
          {loadError ?? '无法连接本地后端'}。请运行 <code>make dev</code> 或手动启动服务。
        </div>
      )}

      <nav className="tabs">
        <button className={`tab ${tab === 'profiles' ? 'active' : ''}`} onClick={() => setTab('profiles')}>
          Profile
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          历史
        </button>
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          设置
        </button>
      </nav>

      <div className="content">
        {tab === 'profiles' && (
          <ProfileList
            profiles={profiles}
            onCreate={() => setCreating(true)}
            onEdit={setEditing}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
            onSeedExample={handleSeedExample}
          />
        )}
        {tab === 'history' && <HistoryList items={history} />}
        {tab === 'settings' && (
          <SettingsPanel
            extensionConfig={extensionConfig}
            settings={settings}
            backendOnline={backendStatus === 'ok'}
            onSave={handleSaveSettings}
            onSaveExtensionConfig={handleSaveExtensionConfig}
          />
        )}
      </div>
    </div>
  );
}
