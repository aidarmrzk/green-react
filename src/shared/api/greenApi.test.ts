import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, GreenApi } from './greenApi';

const credentials = {
  idInstance: '3100123456',
  apiTokenInstance: 'test-token',
};

afterEach(() => vi.unstubAllGlobals());

describe('GREEN-API client', () => {
  it('rejects invalid history responses', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'unavailable' })));
    await expect(new GreenApi(credentials).history('10000000')).rejects.toThrow();
  });
  it('loads text history for the canonical MAX chat id', async () => {
    const requests: { url: string; method?: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      requests.push({ url, method: init.method, body: JSON.parse(init.body as string) });
      return new Response(
        JSON.stringify([
          {
            idMessage: 'new',
            chatId: '10000000',
            type: 'outgoing',
            timestamp: 20,
            typeMessage: 'textMessage',
            textMessage: 'Ответ',
            statusMessage: 'read',
          },
          {
            idMessage: 'old',
            chatId: '10000000',
            type: 'incoming',
            timestamp: 10,
            typeMessage: 'extendedTextMessage',
            extendedTextMessage: { text: 'https://example.com' },
          },
          {
            idMessage: 'file',
            chatId: '10000000',
            type: 'incoming',
            timestamp: 5,
            typeMessage: 'imageMessage',
          },
        ]),
      );
    });
    expect(await new GreenApi(credentials).history('10000000')).toEqual([
      { id: 'old', text: 'https://example.com', timestamp: 10000, direction: 'incoming' },
      { id: 'new', text: 'Ответ', timestamp: 20000, direction: 'outgoing', status: 'read' },
    ]);
    expect(requests).toEqual([
      {
        url: 'https://4100.api.green-api.com/waInstance3100123456/getChatHistory/test-token',
        method: 'POST',
        body: { chatId: '10000000', count: 20 },
      },
    ]);
  });
  it('sends text to the resolved MAX identifier using the documented endpoint', async () => {
    const requests: { url: string; body: unknown; method?: string }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      requests.push({ url, body: JSON.parse(init.body as string), method: init.method });
      return new Response(JSON.stringify({ idMessage: '17000001' }));
    });
    expect(await new GreenApi(credentials).send('10000000', 'Привет\nКак дела?')).toBe('17000001');
    expect(requests).toEqual([
      {
        url: 'https://4100.api.green-api.com/waInstance3100123456/sendMessage/test-token',
        method: 'POST',
        body: { chatId: '10000000', message: 'Привет\nКак дела?' },
      },
    ]);
  });

  it('uses the canonical chatId returned by phone lookup', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(JSON.stringify({ exist: true, chatId: '12345678', fromCache: true })),
    );
    expect(await new GreenApi(credentials).checkAccount('79991234567')).toBe('12345678');
  });

  it('rejects a number without a MAX account', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response(JSON.stringify({ exist: false, chatId: '', fromCache: false })),
    );
    await expect(new GreenApi(credentials).checkAccount('79991234567')).rejects.toThrow(
      'не найден',
    );
  });

  it('does not expose server payloads containing a token in errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('test-token private details', { status: 401 }));
    await expect(new GreenApi(credentials).state()).rejects.toMatchObject({ status: 401 });
    await expect(new GreenApi(credentials).state()).rejects.not.toThrow('test-token');
  });

  it('rejects a response without a message id instead of reporting successful sending', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({})));
    await expect(new GreenApi(credentials).send('10000000', 'Привет')).rejects.toThrow('ответ');
  });

  it('keeps authorization failures distinguishable from temporary failures', () => {
    expect(new ApiError('Ошибка', 403).status).toBe(403);
  });
});
