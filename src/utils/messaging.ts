export const EXTENSION_CONTEXT_INVALIDATED_MSG =
  '扩展已更新，请刷新当前页面后重试（按 F5 或 Cmd+R）';

export function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

export function formatExtensionError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Extension context invalidated')) {
    return EXTENSION_CONTEXT_INVALIDATED_MSG;
  }
  return msg;
}

export async function sendExtensionMessage<T = unknown>(message: unknown): Promise<T> {
  if (!isExtensionContextValid()) {
    throw new Error(EXTENSION_CONTEXT_INVALIDATED_MSG);
  }

  try {
    const response = await chrome.runtime.sendMessage(message);
    if (response === undefined) {
      throw new Error('扩展后台未响应，请刷新页面或在 chrome://extensions 重新加载 ReplyPilot');
    }
    return response as T;
  } catch (err) {
    throw new Error(formatExtensionError(err));
  }
}
