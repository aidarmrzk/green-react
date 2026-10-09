import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { GreenApi } from '../../../shared/api/greenApi';
import type { Chat, MessageStatus, Notification } from '../../../shared/types';
import { mergeMessages, parseIncoming } from '../lib/messages';
import { pollNotifications } from '../lib/notifications';

export function useChatNotifications(
  api: GreenApi,
  selectedRef: RefObject<string | null>,
  setChats: Dispatch<SetStateAction<Chat[]>>,
) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [fatal, setFatal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const statuses = useRef(new Map<string, { status: MessageStatus; error?: string }>());
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const handleNotification = async (notification: Notification) => {
      const incoming = parseIncoming(notification);
      if (incoming && !seen.current.has(incoming.message.id)) {
        seen.current.add(incoming.message.id);
        const active = selectedRef.current === incoming.chatId;
        setChats((previous) => {
          const existing = previous.find((chat) => chat.id === incoming.chatId);
          if (!existing)
            return [
              {
                id: incoming.chatId,
                name: incoming.name,
                phone: incoming.phone,
                messages: [incoming.message],
                unread: active ? 0 : 1,
              },
              ...previous,
            ];
          if (existing.messages.some((message) => message.id === incoming.message.id))
            return previous;
          return previous.map((chat) =>
            chat.id === incoming.chatId
              ? {
                  ...chat,
                  messages: mergeMessages(chat.messages, [incoming.message]),
                  unread: active ? 0 : chat.unread + 1,
                }
              : chat,
          );
        });
      }
      const body = notification.body;
      if (
        body.typeWebhook === 'outgoingMessageStatus' &&
        body.idMessage &&
        ['sent', 'delivered', 'read', 'failed', 'noAccount'].includes(body.status ?? '')
      ) {
        const status: MessageStatus =
          body.status === 'noAccount' ? 'failed' : (body.status as MessageStatus);
        const error =
          body.status === 'noAccount'
            ? 'У получателя нет аккаунта MAX.'
            : status === 'failed'
              ? 'Сообщение не доставлено. Попробуйте отправить его ещё раз.'
              : undefined;
        const delivery = { status, error };
        statuses.current.set(body.idMessage, delivery);
        setChats((previous) =>
          previous.map((chat) => ({
            ...chat,
            messages: chat.messages.map((message) =>
              message.id === body.idMessage ? { ...message, ...delivery } : message,
            ),
          })),
        );
      }
      if (body.typeWebhook === 'stateInstanceChanged' && body.stateInstance !== 'authorized') {
        const state = await api.state(controller.signal);
        if (controller.signal.aborted) return false;
        if (state !== 'authorized') {
          setConnectionError(
            'Инстанс отключён от MAX. Авторизуйте его в GREEN-API и подключитесь заново.',
          );
          setFatal(true);
          return false;
        }
      }
    };
    void pollNotifications(api, controller.signal, handleNotification, (error, stopped) => {
      setConnectionError(error);
      setFatal(Boolean(stopped));
    });
    return () => controller.abort();
  }, [api, selectedRef, setChats]);

  return { connectionError, fatal, abortRef, statuses };
}
