import { useState } from 'react';
import type { ReplyExample, SocialProfile } from '../../types';

type Props = {
  initial: SocialProfile;
  onSave: (data: Omit<SocialProfile, 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
};

function TagInput({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="tag-input-row">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add}>添加</button>
      </div>
      <div className="tags">
        {values.map((v) => (
          <span key={v} className="tag">{v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfileForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(initial);
  const update = <K extends keyof SocialProfile>(key: K, value: SocialProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateExample = (index: number, field: keyof ReplyExample, value: string) => {
    const examples = [...form.examples];
    examples[index] = { ...examples[index], [field]: value };
    update('examples', examples);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('请填写 Profile 名称'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Profile 名称 *</label>
        <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="例如：加拿大转型账号" />
      </div>
      <div className="form-group">
        <label>平台</label>
        <select value={form.platform} onChange={(e) => update('platform', e.target.value as SocialProfile['platform'])}>
          <option value="xiaohongshu">小红书</option>
          <option value="bilibili">B站</option>
          <option value="x">X / Twitter</option>
          <option value="zhihu">知乎</option>
          <option value="generic">通用</option>
        </select>
      </div>
      <div className="form-group">
        <label>账号名称</label>
        <input value={form.accountName} onChange={(e) => update('accountName', e.target.value)} />
      </div>
      <div className="form-group">
        <label>账号简介</label>
        <textarea value={form.accountDescription} onChange={(e) => update('accountDescription', e.target.value)} />
      </div>

      <p className="section-title">创作者定位</p>
      <div className="form-group">
        <label>创作者背景</label>
        <textarea value={form.creatorBackground} onChange={(e) => update('creatorBackground', e.target.value)} />
      </div>
      <div className="form-group">
        <label>内容目的</label>
        <textarea value={form.contentPurpose} onChange={(e) => update('contentPurpose', e.target.value)} />
      </div>
      <div className="form-group">
        <label>目标受众</label>
        <textarea value={form.targetAudience} onChange={(e) => update('targetAudience', e.target.value)} />
      </div>

      <p className="section-title">风格与人设</p>
      <div className="form-group">
        <label>Writing DNA — 我怎么说话</label>
        <textarea
          value={form.writingDna}
          onChange={(e) => update('writingDna', e.target.value)}
          placeholder="描述你平时怎么写评论：句式、用词习惯、开头结尾、绝不用的表达…"
          rows={4}
        />
        <p className="form-hint">口语习惯与用词偏好</p>
      </div>
      <div className="form-group">
        <label>回复风格 Prompt</label>
        <textarea
          value={form.replyVoiceGuide}
          onChange={(e) => update('replyVoiceGuide', e.target.value)}
          placeholder={'你正在扮演：[你的身份]\n\n回复风格：\n- 像真人聊天，尽量短\n- 优先讲自己的感受\n\n少用：\n- 鸡汤句式\n\n优先使用：\n- 其实我也…\n- 我也不知道…'}
          rows={14}
        />
        <p className="form-hint">生成回复时最重要的规则 — 角色、语气、禁用表达、优先句式都写在这里</p>
      </div>
      <div className="form-group">
        <label>人设描述</label>
        <textarea value={form.persona} onChange={(e) => update('persona', e.target.value)} />
      </div>
      <TagInput label="语气" values={form.tone} onChange={(v) => update('tone', v)} placeholder="例如：真诚" />
      <TagInput label="沟通风格" values={form.communicationStyle} onChange={(v) => update('communicationStyle', v)} />
      <TagInput label="偏好话题" values={form.preferredTopics} onChange={(v) => update('preferredTopics', v)} />
      <TagInput label="回避话题" values={form.avoidTopics} onChange={(v) => update('avoidTopics', v)} />
      <TagInput label="禁用短语" values={form.forbiddenPhrases} onChange={(v) => update('forbiddenPhrases', v)} placeholder="例如：家人们" />
      <TagInput label="回复原则" values={form.replyPrinciples} onChange={(v) => update('replyPrinciples', v)} />

      <p className="section-title">输出偏好</p>
      <div className="form-group">
        <label>语言</label>
        <select value={form.language} onChange={(e) => update('language', e.target.value as SocialProfile['language'])}>
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="auto">自动</option>
        </select>
      </div>
      <div className="form-group">
        <label>默认回复长度</label>
        <select value={form.defaultReplyLength} onChange={(e) => update('defaultReplyLength', e.target.value as SocialProfile['defaultReplyLength'])}>
          <option value="short">短（1-2句）</option>
          <option value="medium">中（2-4句）</option>
          <option value="long">长（4-6句）</option>
        </select>
      </div>

      <p className="section-title">示例回复</p>
      {form.examples.map((ex, i) => (
        <div key={i} className="example-row">
          <div className="form-group">
            <label>评论</label>
            <input value={ex.comment} onChange={(e) => updateExample(i, 'comment', e.target.value)} />
          </div>
          <div className="form-group">
            <label>回复</label>
            <textarea value={ex.reply} onChange={(e) => updateExample(i, 'reply', e.target.value)} />
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => update('examples', form.examples.filter((_, j) => j !== i))}>
            删除示例
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => update('examples', [...form.examples, { comment: '', reply: '' }])}>
        + 添加示例
      </button>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">保存</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}
