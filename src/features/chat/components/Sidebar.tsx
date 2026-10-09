import { useState } from 'react';
import { Avatar } from '../../../shared/ui/Avatar';
import type { Chat } from '../../../shared/types';
import { Icon } from '../../../shared/ui/Icon';

export function Sidebar({
  chats,
  selectedId,
  onSelect,
  onNew,
  onLogout,
  connectionError,
}: {
  chats: Chat[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onLogout: () => void;
  connectionError: string | null;
}) {
  const [search, setSearch] = useState('');
  const query = search.toLowerCase();
  const filtered = chats.filter((chat) =>
    `${chat.name} ${chat.phone ?? ''}`.toLowerCase().includes(query),
  );
  const sorted = [...filtered].sort(
    (a, b) => (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0),
  );
  return (
    <>
      <nav className="rail" aria-label="Навигация">
        <div className="rail-logo" aria-label="MAX">
          m
        </div>
        <div className="rail-current">
          <Icon name="chat" />
          <span>Чаты</span>
        </div>
        <button className="rail-logout" aria-label="Выйти" title="Выйти" onClick={onLogout}>
          <Icon name="logout" />
          <span>Выйти</span>
        </button>
      </nav>
      <aside className="sidebar" aria-label="Список чатов">
        <header className="sidebar-header">
          <h1>Чаты</h1>
          <button
            className="new-chat-button"
            onClick={onNew}
            aria-label="Новый чат"
            title="Новый чат"
          >
            <Icon name="plus" />
          </button>
        </header>
        <div className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label="Найти чат"
            placeholder="Найти"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="chat-list">
          {sorted.map((chat) => {
            const last = chat.messages.at(-1);
            return (
              <button
                key={chat.id}
                className={`chat-row ${selectedId === chat.id ? 'selected' : ''}`}
                aria-label={`Открыть чат ${chat.name}`}
                aria-current={selectedId === chat.id ? 'true' : undefined}
                onClick={() => onSelect(chat.id)}
              >
                <Avatar name={chat.name} id={chat.id} />
                <span className="chat-row-content">
                  <span className="chat-row-top">
                    <strong>{chat.name}</strong>
                    {last && (
                      <time>
                        {new Date(last.timestamp).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    )}
                  </span>
                  <span className="chat-row-bottom">
                    <span>
                      {last
                        ? `${last.direction === 'outgoing' ? 'Вы: ' : ''}${last.text}`
                        : 'Пока нет сообщений'}
                    </span>
                    {chat.unread > 0 && (
                      <span className="unread" aria-label={`${chat.unread} непрочитанных`}>
                        {chat.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
          {sorted.length === 0 && (
            <div className="sidebar-empty">
              <Icon name={search ? 'search' : 'chat'} size={32} />
              <h2>{search ? 'Ничего не найдено' : 'Здесь будут ваши чаты'}</h2>
              <p>
                {search ? 'Попробуйте другой номер или имя.' : 'Нажмите +, чтобы написать первым.'}
              </p>
            </div>
          )}
        </div>
        <div className="connection-state">
          <span className={`connection-dot ${connectionError ? 'offline' : ''}`} />
          {connectionError ? 'Соединение прервано' : 'Подключено к GREEN-API'}
        </div>
      </aside>
    </>
  );
}
