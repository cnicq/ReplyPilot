import { useEffect, useState } from 'react';
import type { AIProvider, AppSettings, ExtensionConfig } from '../../types';
import { PROVIDER_DEFAULTS } from '../../types';

type Props = {
  extensionConfig: ExtensionConfig;
  settings: AppSettings;
  backendOnline: boolean;
  onSave: (settings: AppSettings) => void;
  onSaveExtensionConfig: (config: ExtensionConfig) => void;
};

const PROVIDER_ORDER: AIProvider[] = ['mimo', 'openai', 'deepseek', 'qwen', 'custom'];

export default function SettingsPanel({
  extensionConfig,
  settings,
  backendOnline,
  onSave,
  onSaveExtensionConfig,
}: Props) {
  const [extForm, setExtForm] = useState(extensionConfig);
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setExtForm(extensionConfig);
    setForm(settings);
  }, [extensionConfig, settings]);

  const handleProviderChange = (provider: AIProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider];
    setForm((prev) => ({
      ...prev,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveExtensionConfig(extForm);
    await onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      {!backendOnline && (
        <div className="alert alert-warning">
          本地后端未连接。请先启动 PostgreSQL 和 FastAPI 服务。
        </div>
      )}

      {!form.apiKey && backendOnline && (
        <div className="alert alert-warning">
          请配置 API Key，才能在小红书页面生成回复。
        </div>
      )}

      {saved && <div className="alert alert-success">设置已保存</div>}

      <div className="form-group">
        <label>FastAPI 地址</label>
        <input
          value={extForm.apiBaseUrl}
          onChange={(e) => setExtForm({ ...extForm, apiBaseUrl: e.target.value })}
          placeholder="http://localhost:7800"
        />
      </div>

      <p className="section-title">AI Provider</p>

      <div className="form-group">
        <label>提供商</label>
        <select
          value={form.provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
        >
          {PROVIDER_ORDER.map((id) => (
            <option key={id} value={id}>{PROVIDER_DEFAULTS[id].label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>API Key</label>
        <input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          placeholder="sk-..."
        />
        <p className="form-hint">存储在本地 PostgreSQL，不会离开你的电脑</p>
      </div>

      <div className="form-group">
        <label>API Base URL</label>
        <input
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder={PROVIDER_DEFAULTS[form.provider].baseUrl}
          disabled={form.provider !== 'custom'}
        />
      </div>

      <div className="form-group">
        <label>模型</label>
        <input
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          placeholder={PROVIDER_DEFAULTS[form.provider].model}
        />
      </div>

      <div className="form-group">
        <label>历史记忆条数</label>
        <input
          type="number"
          min={5}
          max={30}
          value={form.maxHistoryExamples}
          onChange={(e) => setForm({ ...form, maxHistoryExamples: Number(e.target.value) })}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">保存设置</button>
      </div>
    </form>
  );
}
