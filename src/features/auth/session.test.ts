import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GreenApi } from '../../shared/api/greenApi';
import { readSession, writeSession } from './session';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

const credentials = { idInstance: '4100123456', apiTokenInstance: 'test-token' };

describe('saved connection', () => {
  it('restores credentials after recreating the client', () => {
    writeSession(new GreenApi(credentials));
    expect(readSession()?.credentials).toEqual({
      idInstance: '4100123456',
      apiTokenInstance: 'test-token',
    });
  });

  it('does not restore a connection after logout', () => {
    writeSession(new GreenApi(credentials));
    writeSession(null);
    expect(readSession()).toBeNull();
  });

  it.each([
    'invalid json',
    'null',
    '{"idInstance":"4100123456"}',
    '{"idInstance":"abc","apiTokenInstance":"token"}',
  ])('ignores damaged credentials: %s', (value) => {
    localStorage.setItem('max-chat.credentials', value);
    expect(readSession()).toBeNull();
  });

  it('keeps the application usable when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage blocked');
      },
      setItem: () => {
        throw new Error('Storage blocked');
      },
      removeItem: () => {
        throw new Error('Storage blocked');
      },
    });
    expect(readSession()).toBeNull();
    expect(() => writeSession(new GreenApi(credentials))).not.toThrow();
    expect(() => writeSession(null)).not.toThrow();
  });
});
