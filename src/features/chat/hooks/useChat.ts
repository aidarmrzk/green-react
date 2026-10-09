import { MAX_MESSAGE_LENGTH } from '../../../shared/config';
import { useEffect, useRef, useState } from 'react';
import type { GreenApi } from '../../../shared/api/greenApi';
import { createOutgoingMessage } from '../lib/messages';
import { normalizePhone } from '../lib/phone';
import { useChatHistory } from './useChatHistory';
import { useChatNotifications } from './useChatNotifications';
import { readChats, writeChats } from '../storage';
import type { Chat } from '../../../shared/types';

export function useChat(api: GreenApi) {
  const [saved] = useState(() => readChats(api.credentials.idInstance));
  const [chats, setChats] = useState<Chat[]>(saved.chats);
  const [selectedId, setSelectedId] = useState<string | null>(saved.selectedId);
  const selectedRef = useRef<string | null>(saved.selectedId);
  const history = useChatHistory(api, selectedId, setChats);
  const { connectionError, fatal, abortRef, statuses } = useChatNotifications(
    api,
    selectedRef,
    setChats,
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    writeChats(api.credentials.idInstance, chats, selectedId);
  }, [api, chats, selectedId]);

  function selectChat(id: string | null) {
    if (id && id === selectedRef.current) history.reload();
    selectedRef.current = id;
    setSelectedId(id);
    setSendError(null);
    if (id)
      setChats((previous) =>
        previous.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)),
      );
  }

  async function createChat(value: string) {
    const phone = normalizePhone(value);
    const signal = abortRef.current?.signal;
    const id = await api.checkAccount(phone, signal);
    if (signal?.aborted) return;
    setChats((previous) =>
      previous.some((chat) => chat.id === id)
        ? previous
        : [{ id, name: `+${phone}`, phone, messages: [], unread: 0 }, ...previous],
    );
    selectChat(id);
  }

  async function sendMessage() {
    const id = selectedRef.current;
    const text = id ? (drafts[id] ?? '') : '';
    if (!id || !text.trim() || text.length > MAX_MESSAGE_LENGTH || sendingRef.current || fatal)
      return;
    const signal = abortRef.current?.signal;
    sendingRef.current = true;
    setSending(true);
    setSendError(null);
    try {
      const messageId = await api.send(id, text, signal);
      if (signal?.aborted) return;
      const message = createOutgoingMessage(messageId, text, statuses.current.get(messageId));
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === id ? { ...chat, messages: [...chat.messages, message] } : chat,
        ),
      );
      setDrafts((previous) => ({ ...previous, [id]: previous[id] === text ? '' : previous[id] }));
    } catch (error) {
      if (!signal?.aborted)
        setSendError(error instanceof Error ? error.message : 'Не удалось отправить сообщение.');
    } finally {
      sendingRef.current = false;
      if (!signal?.aborted) setSending(false);
    }
  }

  return {
    chats,
    selectedId,
    selectChat,
    createChat,
    sendMessage,
    sending,
    sendError,
    connectionError,
    fatal,
    historyLoading: history.loading,
    historyError: history.error,
    reloadHistory: history.reload,
    draft: selectedId ? (drafts[selectedId] ?? '') : '',
    setDraft: (value: string) => {
      if (selectedId) setDrafts((previous) => ({ ...previous, [selectedId]: value }));
    },
  };
}
