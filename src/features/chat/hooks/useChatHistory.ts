import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { GreenApi } from '../../../shared/api/greenApi';
import type { Chat } from '../../../shared/types';
import { mergeMessages } from '../lib/messages';

export function useChatHistory(
  api: GreenApi,
  selectedId: string | null,
  setChats: Dispatch<SetStateAction<Chat[]>>,
) {
  const [historyState, setHistoryState] = useState<{
    chatId: string | null;
    loading: boolean;
    error: string | null;
  }>({ chatId: null, loading: false, error: null });
  const [historyRevision, setHistoryRevision] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const id = selectedId;
    const controller = new AbortController();
    async function loadHistory() {
      setHistoryState({ chatId: selectedId, loading: true, error: null });
      try {
        const messages = await api.history(id, controller.signal);
        if (controller.signal.aborted) return;
        setChats((previous) =>
          previous.map((chat) =>
            chat.id === selectedId
              ? { ...chat, messages: mergeMessages(chat.messages, messages) }
              : chat,
          ),
        );
        setHistoryState({ chatId: selectedId, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted)
          setHistoryState({
            chatId: selectedId,
            loading: false,
            error: error instanceof Error ? error.message : 'Не удалось загрузить переписку.',
          });
      }
    }
    void loadHistory();
    return () => controller.abort();
  }, [api, selectedId, historyRevision, setChats]);

  return {
    loading: Boolean(selectedId && (historyState.chatId !== selectedId || historyState.loading)),
    error: historyState.chatId === selectedId ? historyState.error : null,
    reload: () => setHistoryRevision((value) => value + 1),
  };
}
