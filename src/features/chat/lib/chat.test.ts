import { describe, expect, it } from 'vitest';
import { GreenApi } from '../../../shared/api/greenApi';
import { createOutgoingMessage, mergeMessages, parseIncoming } from './messages';
import { normalizePhone } from './phone';
import { pollNotifications } from './notifications';
import type { Notification } from '../../../shared/types';

const notification: Notification = {
  receiptId: 123,
  body: {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1763115112,
    idMessage: '1763115112345',
    senderData: {
      chatId: '10000000',
      chatType: 'user',
      senderName: 'Алексей',
      senderContactName: '',
      senderPhoneNumber: 79991234567,
    },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет!' } },
  },
};

describe('phone numbers', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['+375 (29) 123-45-67', '375291234567'],
  ])('normalizes %s', (input, want) => {
    expect(normalizePhone(input)).toBe(want);
  });
  it.each(['', '123', '+1 212 123 4567', '79991234567abc', '799912345678'])(
    'rejects %s',
    (input) => {
      expect(() => normalizePhone(input)).toThrow();
    },
  );
});

describe('incoming notifications', () => {
  it('routes a text response by the canonical MAX id and converts timestamp', () => {
    expect(parseIncoming(notification)).toEqual({
      chatId: '10000000',
      name: 'Алексей',
      phone: '79991234567',
      message: {
        id: '1763115112345',
        text: 'Привет!',
        timestamp: 1763115112000,
        direction: 'incoming',
      },
    });
  });
  it('accepts text containing a URL', () => {
    expect(
      parseIncoming({
        ...notification,
        body: {
          ...notification.body,
          messageData: {
            typeMessage: 'extendedTextMessage',
            extendedTextMessageData: { text: 'Посмотри https://example.com' },
          },
        },
      })?.message.text,
    ).toBe('Посмотри https://example.com');
  });
  it('skips files and group messages', () => {
    expect(
      parseIncoming({
        ...notification,
        body: { ...notification.body, messageData: { typeMessage: 'imageMessage' } },
      }),
    ).toBeNull();
    expect(
      parseIncoming({
        ...notification,
        body: { ...notification.body, senderData: { chatId: '-123', chatType: 'group' } },
      }),
    ).toBeNull();
  });
});

describe('notification queue', () => {
  it('processes a notification before acknowledging and stops when disconnected', async () => {
    const controller = new AbortController();
    const order: string[] = [];
    const api = new GreenApi({
      idInstance: '3100123456',
      apiTokenInstance: 'test',
    });
    api.receive = async () => notification;
    api.acknowledge = async (receiptId) => {
      order.push(`ack:${receiptId}`);
      controller.abort();
    };
    await pollNotifications(
      api,
      controller.signal,
      (value) => {
        order.push(`receive:${value.body.idMessage}`);
      },
      () => {},
    );
    expect(order).toEqual(['receive:1763115112345', 'ack:123']);
  });
  it('does not process a response arriving after disconnect', async () => {
    const controller = new AbortController();
    const api = new GreenApi({
      idInstance: '3100123456',
      apiTokenInstance: 'test',
    });
    api.receive = async () => {
      controller.abort();
      return notification;
    };
    const received: Notification[] = [];
    await pollNotifications(
      api,
      controller.signal,
      (value) => {
        received.push(value);
      },
      () => {},
    );
    expect(received).toEqual([]);
  });
});

describe('successful outgoing messages', () => {
  it('merges history without duplicating live messages or losing a newer delivery status', () => {
    const current = createOutgoingMessage('same', 'Ответ', { status: 'read' });
    const old = { id: 'old', text: 'Привет', timestamp: 1, direction: 'incoming' as const };
    expect(mergeMessages([current], [old, { ...current, status: 'sent' }])).toEqual([old, current]);
    expect(mergeMessages([{ ...current, status: 'sent' }], [current])[0].status).toBe('read');
  });
  it('marks a successful API response as sent without waiting for a webhook', () => {
    expect(createOutgoingMessage('message-1', 'Привет')).toMatchObject({
      id: 'message-1',
      text: 'Привет',
      direction: 'outgoing',
      status: 'sent',
    });
  });
  it('preserves a delivery event received before the send response', () => {
    expect(createOutgoingMessage('message-1', 'Привет', { status: 'read' }).status).toBe('read');
    expect(
      createOutgoingMessage('message-2', 'Привет', {
        status: 'failed',
        error: 'У получателя нет аккаунта MAX.',
      }),
    ).toMatchObject({ status: 'failed', error: 'У получателя нет аккаунта MAX.' });
  });
});
