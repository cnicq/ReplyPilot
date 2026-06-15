import type { SocialProfile } from '../../types';

type Props = {
  profiles: SocialProfile[];
  onCreate: () => void;
  onEdit: (profile: SocialProfile) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onSeedExample: () => void;
};

export default function ProfileList({
  profiles,
  onCreate,
  onEdit,
  onDelete,
  onSetDefault,
  onSeedExample,
}: Props) {
  if (profiles.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有创建任何账号 Profile。<br />可导入示例快速体验，或自己创建一个。</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onSeedExample}>导入示例 Profile</button>
          <button className="btn btn-secondary" onClick={onCreate}>自己创建</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#666' }}>{profiles.length} 个 Profile</span>
        <button className="btn btn-primary btn-sm" onClick={onCreate}>+ 新建</button>
      </div>

      {profiles.map((profile) => (
        <div key={profile.id} className={`profile-card ${profile.isDefault ? 'default' : ''}`}>
          <div className="profile-card-header">
            <span className="profile-card-name">{profile.name}</span>
            {profile.isDefault && <span className="profile-card-badge">默认</span>}
          </div>
          <div className="profile-card-meta">{profile.accountName} · {profile.platform}</div>
          <div className="profile-card-actions">
            {!profile.isDefault && (
              <button className="btn btn-secondary btn-sm" onClick={() => onSetDefault(profile.id)}>
                设为默认
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(profile)}>编辑</button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (confirm(`确定删除「${profile.name}」？`)) onDelete(profile.id);
              }}
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
