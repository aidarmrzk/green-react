import type { IncomingMessage, Message, Notification } from '../../../shared/types';

const statuses = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

export function mergeMessages(current: Message[], history: Message[]): Message[] {
  const messages = new Map(history.map((message) => [message.id, message]));
  for (const message of current) {
    const existing = messages.get(message.id);
    messages.set(
      message.id,
      existing?.status && message.status && statuses[existing.status] > statuses[message.status]
        ? { ...message, status: existing.status, error: existing.error }
        : message,
    );
  }
  return [...messages.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function parseIncoming(notification: Notification): IncomingMessage | null {
  const body = notification.body;
  if (
    body.typeWebhook !== 'incomingMessageReceived' ||
    !body.idMessage ||
    !body.senderData?.chatId ||
    body.senderData.chatType === 'group'
  )
    return null;
  const data = body.messageData;
  const text =
    data?.typeMessage === 'textMessage'
      ? data.textMessageData?.textMessage
      : data?.typeMessage === 'extendedTextMessage'
        ? data.extendedTextMessageData?.text
        : undefined;
  if (typeof text !== 'string') return null;
  const sender = body.senderData;
  const phone = sender.senderPhoneNumber ? String(sender.senderPhoneNumber) : undefined;
  return {
    chatId: sender.chatId,
    name: sender.senderContactName || sender.senderName || (phone ? `+${phone}` : sender.chatId),
    phone,
    message: {
      id: body.idMessage,
      text,
      timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
      direction: 'incoming',
    },
  };
}

export function createOutgoingMessage(
  id: string,
  text: string,
  delivery?: Pick<Message, 'status' | 'error'>,
): Message {
  return {
    id,
    text,
    timestamp: Date.now(),
    direction: 'outgoing',
    ...(delivery ?? { status: 'sent' }),
  };
}
