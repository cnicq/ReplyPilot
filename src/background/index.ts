import { addReplyHistory, generateReplies, getDefaultProfileInfo, lookupCachedReplies } from '../storage';
import type { GenerateRepliesRequest, GenerateRepliesResponse, MessageType } from '../types';

chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    const safeRespond = (fn: () => Promise<unknown>) => {
      fn()
        .then((result) => sendResponse(result))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : '操作失败';
          sendResponse({ error: msg });
        });
    };

    if (message.type === 'GENERATE_REPLIES') {
      safeRespond(() => handleGenerate(message.payload));
      return true;
    }

    if (message.type === 'SAVE_REPLY_HISTORY') {
      safeRespond(() =>
        addReplyHistory(message.payload).then((item) => ({ success: true, item }))
      );
      return true;
    }

    if (message.type === 'LOOKUP_CACHED_REPLIES') {
      safeRespond(() =>
        lookupCachedReplies(message.payload.sourceComment).then((result) => result)
      );
      return true;
    }

    if (message.type === 'GET_DEFAULT_PROFILE') {
      safeRespond(() => getDefaultProfileInfo().then((profile) => ({ profile })));
      return true;
    }

    return false;
  }
);

async function handleGenerate(
  request: GenerateRepliesRequest
): Promise<GenerateRepliesResponse | { error: string }> {
  try {
    return await generateReplies(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '生成失败';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { error: '无法连接本地后端，请确认 FastAPI 已启动 (localhost:7800)' };
    }
    return { error: msg };
  }
}
