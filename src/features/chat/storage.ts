import type { Chat } from '../../shared/types';

export function readChats(instance: string): { chats: Chat[]; selectedId: string | null } {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`max-chat.chats.${instance}`) ?? 'null');
    if (!saved || typeof saved !== 'object' || !('chats' in saved) || !Array.isArray(saved.chats))
      return { chats: [], selectedId: null };
    const selectedId =
      'selectedId' in saved && typeof saved.selectedId === 'string' ? saved.selectedId : null;
    const chats: Chat[] = saved.chats.flatMap((value: unknown) => {
      if (
        !value ||
        typeof value !== 'object' ||
        !('id' in value) ||
        !('name' in value) ||
        typeof value.id !== 'string' ||
        !value.id ||
        typeof value.name !== 'string'
      )
        return [];
      return [
        {
          id: value.id,
          name: value.name,
          ...('phone' in value && typeof value.phone === 'string' ? { phone: value.phone } : {}),
          messages: [],
          unread: 0,
        },
      ];
    });
    return {
      chats,
      selectedId: chats.some((chat) => chat.id === selectedId) ? selectedId : null,
    };
  } catch {
    return { chats: [], selectedId: null };
  }
}

export function writeChats(instance: string, chats: Chat[], selectedId: string | null): void {
  try {
    const key = `max-chat.chats.${instance}`;
    const value = JSON.stringify({
      chats: chats.map(({ id, name, phone }) => ({ id, name, phone })),
      selectedId,
    });
    if (localStorage.getItem(key) !== value) localStorage.setItem(key, value);
  } catch {
    // При недоступном хранилище чаты остаются в памяти вкладки.
  }
}
