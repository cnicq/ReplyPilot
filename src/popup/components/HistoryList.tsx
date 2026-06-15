import type { ReplyHistoryItem } from '../../types';

const ACTION_LABEL: Record<string, string> = {
  generated: '已生成',
  copied: '已复制',
  saved: '已保存',
  edited: '已编辑',
};

type Props = {
  items: ReplyHistoryItem[];
};

export default function HistoryList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有回复历史。<br />在小红书复制回复后，会出现在这里并用于改进后续生成。</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        最近 {items.length} 条记录
      </p>
      {items.map((item) => {
        const reply = item.editedReply ?? item.selectedReply ?? item.generatedReplies[0] ?? '';
        const date = item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '';
        return (
          <div key={item.id} className="history-card">
            <div className="history-card-meta">
              <span>{ACTION_LABEL[item.action] ?? item.action}</span>
              <span>{date}</span>
            </div>
            <div className="history-comment">
              <label>评论</label>
              <p>{item.sourceComment}</p>
            </div>
            <div className="history-reply">
              <label>回复</label>
              <p>{reply}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
