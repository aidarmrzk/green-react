export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  status?: MessageStatus;
  error?: string;
}

export interface Chat {
  id: string;
  name: string;
  phone?: string;
  messages: Message[];
  unread: number;
}

export interface WebhookBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  chatId?: string;
  status?: string;
  stateInstance?: string;
  senderData?: {
    chatId: string;
    chatType?: string;
    senderName?: string;
    senderContactName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
}

export interface Notification {
  receiptId: number;
  body: WebhookBody;
}

export interface IncomingMessage {
  chatId: string;
  name: string;
  phone?: string;
  message: Message;
}
