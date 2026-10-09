import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readChats, writeChats } from './storage';
import type { Chat } from '../../shared/types';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('saved chats', () => {
  const chat: Chat = {
    id: '10000000',
    name: '+79991234567',
    phone: '79991234567',
    unread: 2,
    messages: [{ id: 'm1', text: 'Привет', timestamp: 1000, direction: 'incoming' }],
  };
  it('restores a recipient and selected chat after reload', () => {
    writeChats('4100123456', [chat], '10000000');
    expect(readChats('4100123456')).toEqual({
      chats: [
        { id: '10000000', name: '+79991234567', phone: '79991234567', unread: 0, messages: [] },
      ],
      selectedId: '10000000',
    });
  });
  it('keeps different instances separate', () => {
    writeChats('4100123456', [chat], '10000000');
    expect(readChats('4100654321')).toEqual({ chats: [], selectedId: null });
  });
  it('ignores damaged saved data and invalid selections', () => {
    localStorage.setItem(
      'max-chat.chats.4100123456',
      JSON.stringify({
        chats: [null, { id: 123 }, { id: '10000000', name: 'Алексей' }],
        selectedId: 'missing',
      }),
    );
    expect(readChats('4100123456')).toEqual({
      chats: [{ id: '10000000', name: 'Алексей', messages: [], unread: 0 }],
      selectedId: null,
    });
    localStorage.setItem('max-chat.chats.4100123456', 'invalid json');
    expect(readChats('4100123456')).toEqual({ chats: [], selectedId: null });
  });
});
