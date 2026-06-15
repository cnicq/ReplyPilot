import {
  EXTENSION_CONTEXT_INVALIDATED_MSG,
  isExtensionContextValid,
  sendExtensionMessage,
} from '../utils/messaging';

const BUTTON_ID = 'replypilot-fab';
const PANEL_ID = 'replypilot-panel';

let selectedText = '';
let selectionRect: DOMRect | null = null;
let panelOpen = false;
let lastProfileId = '';
let lastGeneratedTexts: string[] = [];

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return null;
  return selection.getRangeAt(0).getBoundingClientRect();
}

function removeFab(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

function removePanel(): void {
  document.getElementById(PANEL_ID)?.remove();
  panelOpen = false;
}

function positionFab(rect: DOMRect): void {
  let fab = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!fab) {
    fab = document.createElement('button');
    fab.id = BUTTON_ID;
    fab.className = 'replypilot-fab';
    fab.textContent = '✦ ReplyPilot';
    fab.addEventListener('mousedown', (e) => e.preventDefault());
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
    document.body.appendChild(fab);
  }
  fab.style.top = `${rect.bottom + window.scrollY + 8}px`;
  fab.style.left = `${rect.left + window.scrollX}px`;
  fab.style.display = 'block';
}

function togglePanel(): void {
  if (!isExtensionContextValid()) {
    showContextInvalidatedNotice();
    return;
  }
  if (panelOpen) {
    removePanel();
    return;
  }
  showPanel();
}

function showContextInvalidatedNotice(): void {
  removeFab();
  removePanel();

  const notice = document.createElement('div');
  notice.id = 'replypilot-context-notice';
  notice.className = 'replypilot-panel replypilot-context-notice';
  notice.innerHTML = `
    <div class="replypilot-panel-header">
      <span class="replypilot-panel-title">ReplyPilot</span>
      <button class="replypilot-close" aria-label="关闭">×</button>
    </div>
    <div class="replypilot-panel-body">
      <div class="replypilot-error" style="display:block">${EXTENSION_CONTEXT_INVALIDATED_MSG}</div>
    </div>
  `;

  if (selectionRect) {
    const top = selectionRect.bottom + window.scrollY + 48;
    const left = Math.min(selectionRect.left + window.scrollX, window.innerWidth - 380);
    notice.style.top = `${top}px`;
    notice.style.left = `${Math.max(8, left)}px`;
  }

  document.body.appendChild(notice);
  notice.querySelector('.replypilot-close')?.addEventListener('click', () => notice.remove());
}

function showPanel(): void {
  removePanel();

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'replypilot-panel';
  panel.innerHTML = `
    <div class="replypilot-panel-header">
      <span class="replypilot-panel-title">ReplyPilot</span>
      <button class="replypilot-close" aria-label="关闭">×</button>
    </div>
    <div class="replypilot-panel-body">
      <div class="replypilot-section">
        <label>选中的评论</label>
        <div class="replypilot-comment" id="rp-source-comment"></div>
      </div>
      <div class="replypilot-section">
        <label>当前 Profile</label>
        <div class="replypilot-profile" id="rp-profile-name">加载中…</div>
      </div>
      <div class="replypilot-actions">
        <button class="replypilot-generate" id="rp-generate">生成回复</button>
        <button class="replypilot-regenerate" id="rp-regenerate" style="display:none">重新生成</button>
      </div>
      <div class="replypilot-cache-hint" id="rp-cache-hint" style="display:none"></div>
      <div class="replypilot-replies" id="rp-replies"></div>
      <div class="replypilot-error" id="rp-error"></div>
    </div>
  `;

  document.body.appendChild(panel);
  panelOpen = true;

  if (selectionRect) {
    const top = selectionRect.bottom + window.scrollY + 48;
    const left = Math.min(selectionRect.left + window.scrollX, window.innerWidth - 380);
    panel.style.top = `${top}px`;
    panel.style.left = `${Math.max(8, left)}px`;
  }

  const commentEl = panel.querySelector('#rp-source-comment');
  if (commentEl) commentEl.textContent = selectedText;

  panel.querySelector('.replypilot-close')?.addEventListener('click', () => removePanel());
  void loadDefaultProfile();
  void tryLoadCachedReplies();
  panel.querySelector('#rp-generate')?.addEventListener('click', () => handleGenerate(false));
  panel.querySelector('#rp-regenerate')?.addEventListener('click', () => handleGenerate(true));
}

function setCacheHint(visible: boolean): void {
  const hint = document.getElementById('rp-cache-hint');
  if (!hint) return;
  if (visible) {
    hint.textContent = '已显示历史回复，无需重复调用 AI。如需新回复请点「重新生成」。';
    hint.style.display = 'block';
  } else {
    hint.textContent = '';
    hint.style.display = 'none';
  }
}

async function fetchCachedReplies(): Promise<{
  replies: Array<{ type: string; text: string }>;
  profileId: string;
} | null> {
  const response = await sendExtensionMessage<{
    error?: string;
    found?: boolean;
    replies?: Array<{ type: string; text: string }>;
    profileId?: string;
  }>({
    type: 'LOOKUP_CACHED_REPLIES',
    payload: { sourceComment: selectedText },
  });

  if (response.error || !response.found || !response.replies?.length || !response.profileId) {
    return null;
  }

  return { replies: response.replies, profileId: response.profileId };
}

async function tryLoadCachedReplies(): Promise<void> {
  const repliesEl = document.getElementById('rp-replies');
  const errorEl = document.getElementById('rp-error');
  if (!repliesEl || !errorEl) return;

  try {
    const cached = await fetchCachedReplies();
    if (!cached) return;

    renderReplies(cached.replies, cached.profileId);
    setCacheHint(true);
  } catch {
    // Ignore cache lookup errors; user can still generate manually.
  }
}

async function loadDefaultProfile(): Promise<void> {
  const el = document.getElementById('rp-profile-name');
  if (!el) return;
  try {
    const response = await sendExtensionMessage<{
      error?: string;
      profile?: { name: string } | null;
    }>({ type: 'GET_DEFAULT_PROFILE' });
    if (response.error) {
      el.textContent = response.error;
      return;
    }
    if (!response.profile) {
      el.textContent = '未设置默认 Profile，请打开扩展配置';
      return;
    }
    el.textContent = response.profile.name;
  } catch (err) {
    el.textContent = err instanceof Error ? err.message : '无法连接后端，请启动 FastAPI 服务';
  }
}

function renderReplies(
  replies: Array<{ type: string; text: string }>,
  profileId: string
): void {
  const repliesEl = document.getElementById('rp-replies');
  const regenBtn = document.getElementById('rp-regenerate');
  if (!repliesEl) return;

  lastProfileId = profileId;
  lastGeneratedTexts = replies.map((r) => r.text);

  const typeLabel: Record<string, string> = {
    sincere: '真诚直接',
    restrained: '克制简约',
    reflective: '经历共鸣',
    // legacy cached replies
    humorous: '克制简约',
    engagement: '经历共鸣',
  };

  repliesEl.innerHTML = replies
    .map((reply, index) => `
      <div class="replypilot-reply-card" data-index="${index}">
        <div class="replypilot-reply-type">${typeLabel[reply.type] ?? reply.type}</div>
        <textarea class="replypilot-reply-edit" rows="3" data-original="${escapeAttr(reply.text)}"></textarea>
        <button class="replypilot-copy">复制</button>
      </div>
    `)
    .join('');

  repliesEl.querySelectorAll('.replypilot-reply-edit').forEach((el, i) => {
    (el as HTMLTextAreaElement).value = replies[i].text;
  });

  if (regenBtn) regenBtn.style.display = 'inline-block';

  repliesEl.querySelectorAll('.replypilot-reply-card').forEach((card) => {
    const textarea = card.querySelector('.replypilot-reply-edit') as HTMLTextAreaElement;
    const copyBtn = card.querySelector('.replypilot-copy') as HTMLButtonElement;
    const original = textarea?.dataset.original ?? '';

    copyBtn?.addEventListener('click', async () => {
      const finalText = textarea.value.trim();
      if (!finalText) return;

      await navigator.clipboard.writeText(finalText);
      copyBtn.textContent = '已复制 ✓';

      const wasEdited = finalText !== original;
      try {
        await sendExtensionMessage({
          type: 'SAVE_REPLY_HISTORY',
          payload: {
            profileId: lastProfileId,
            platform: 'xiaohongshu',
            sourceComment: selectedText,
            generatedReplies: lastGeneratedTexts,
            selectedReply: original,
            editedReply: wasEdited ? finalText : undefined,
            action: wasEdited ? 'edited' : 'copied',
            pageUrl: window.location.href,
          },
        });
      } catch {
        // Copy still succeeds even if history save fails.
      }

      setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
    });
  });
}

async function handleGenerate(isRegenerate: boolean): Promise<void> {
  const generateBtn = document.getElementById('rp-generate') as HTMLButtonElement | null;
  const regenBtn = document.getElementById('rp-regenerate') as HTMLButtonElement | null;
  const repliesEl = document.getElementById('rp-replies');
  const errorEl = document.getElementById('rp-error');
  if (!generateBtn || !repliesEl || !errorEl) return;

  const activeBtn = isRegenerate ? regenBtn : generateBtn;
  if (activeBtn) {
    activeBtn.disabled = true;
    activeBtn.textContent = '生成中…';
  }
  repliesEl.innerHTML = '';
  errorEl.textContent = '';
  setCacheHint(false);

  try {
    if (!isRegenerate) {
      const cached = await fetchCachedReplies();
      if (cached) {
        renderReplies(cached.replies, cached.profileId);
        setCacheHint(true);
        return;
      }
    }

    const response = await sendExtensionMessage<{
      error?: string;
      replies?: Array<{ type: string; text: string }>;
      profileId?: string;
    }>({
      type: 'GENERATE_REPLIES',
      payload: { sourceComment: selectedText, pageUrl: window.location.href },
    });

    if (response.error) {
      errorEl.textContent = response.error;
      return;
    }

    if (!response.replies?.length || !response.profileId) {
      errorEl.textContent = '生成结果为空，请重试';
      return;
    }

    renderReplies(response.replies, response.profileId);
    setCacheHint(false);
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : '生成失败';
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '生成回复';
    if (regenBtn) {
      regenBtn.disabled = false;
      regenBtn.textContent = '重新生成';
    }
  }
}


function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function handleSelectionChange(): void {
  const text = window.getSelection()?.toString().trim() ?? '';
  if (!text || text.length < 2) {
    selectedText = '';
    selectionRect = null;
    removeFab();
    if (panelOpen) removePanel();
    return;
  }
  const rect = getSelectionRect();
  if (!rect) return;
  selectedText = text;
  selectionRect = rect;
  positionFab(rect);
}

document.addEventListener('mouseup', () => setTimeout(handleSelectionChange, 10));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    removeFab();
    removePanel();
    selectedText = '';
  }
});
