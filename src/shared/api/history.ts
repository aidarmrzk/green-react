import type { Message } from '../types';

export interface HistoryMessage {
  idMessage: string;
  chatId: string;
  type: string;
  timestamp: number;
  typeMessage: string;
  textMessage?: string;
  extendedTextMessage?: { text?: string };
  statusMessage?: string;
}

export function parseHistory(result: HistoryMessage[], chatId: string): Message[] {
  return result
    .flatMap((item): Message[] => {
      if (
        !item ||
        item.chatId !== chatId ||
        typeof item.idMessage !== 'string' ||
        !Number.isFinite(item.timestamp) ||
        !['incoming', 'outgoing'].includes(item.type) ||
        !['textMessage', 'extendedTextMessage'].includes(item.typeMessage)
      )
        return [];
      const text = item.textMessage ?? item.extendedTextMessage?.text;
      if (typeof text !== 'string') return [];
      return [
        {
          id: item.idMessage,
          text,
          timestamp: item.timestamp * 1000,
          direction: item.type as Message['direction'],
          ...(item.type === 'outgoing'
            ? {
                status: (['sent', 'delivered', 'read'].includes(item.statusMessage ?? '')
                  ? item.statusMessage
                  : 'sent') as Message['status'],
              }
            : {}),
        },
      ];
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}
