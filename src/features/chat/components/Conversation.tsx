import { MAX_MESSAGE_LENGTH } from '../../../shared/config';
import { useEffect, useRef } from 'react';
import type { Chat, MessageStatus } from '../../../shared/types';
import { Avatar } from '../../../shared/ui/Avatar';
import { Icon } from '../../../shared/ui/Icon';

const statusLabels: Record<MessageStatus, string> = {
  pending: 'В очереди',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не доставлено',
};

export function Conversation({
  chat,
  draft,
  onDraft,
  onSend,
  onBack,
  sending,
  error,
  disabled,
  historyLoading,
  historyError,
  onReloadHistory,
}: {
  chat: Chat;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => Promise<void>;
  onBack: () => void;
  sending: boolean;
  error: string | null;
  disabled: boolean;
  historyLoading: boolean;
  historyError: string | null;
  onReloadHistory: () => void;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.id, chat.messages.length]);
  useEffect(() => {
    if (!sending) input.current?.focus();
  }, [chat.id, sending]);
  useEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(150, element.scrollHeight)}px`;
  }, [draft]);
  const canSend =
    Boolean(draft.trim()) && !sending && !disabled && draft.length <= MAX_MESSAGE_LENGTH;
  return (
    <>
      <header className="conversation-header">
        <button className="icon-button mobile-back" onClick={onBack} aria-label="Назад к чатам">
          <Icon name="back" />
        </button>
        <Avatar id={chat.id} name={chat.name} />
        <div>
          <h2>{chat.name}</h2>
          <span>MAX</span>
        </div>
      </header>
      <div className="messages" role="log" aria-label="Переписка" aria-live="polite">
        {historyLoading && (
          <div className="conversation-start" role="status">
            Загружаем переписку…
          </div>
        )}
        {historyError && (
          <div className="conversation-start" role="status">
            <p>{historyError}</p>
            <button className="primary-button" onClick={onReloadHistory}>
              Повторить загрузку
            </button>
          </div>
        )}
        {chat.messages.length === 0
          ? !historyLoading &&
            !historyError && (
              <div className="conversation-start">
                <span>Начало переписки</span>
                <p>Напишите первое сообщение</p>
              </div>
            )
          : chat.messages.map((message, index) => {
              const date = new Date(message.timestamp).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              });
              const previousDate = index
                ? new Date(chat.messages[index - 1].timestamp).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  })
                : '';
              return (
                <div className="message-group" key={message.id}>
                  {date !== previousDate && (
                    <div className="date-divider">
                      <span>{date}</span>
                    </div>
                  )}
                  <div className={`message ${message.direction}`}>
                    <div className="message-text">{message.text}</div>
                    {message.error && <p className="message-delivery-error">{message.error}</p>}
                    <span className="message-meta">
                      <time dateTime={new Date(message.timestamp).toISOString()}>
                        {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                      {message.direction === 'outgoing' && (
                        <span
                          className={`message-status ${message.status ?? 'pending'}`}
                          title={statusLabels[message.status ?? 'pending']}
                          aria-label={statusLabels[message.status ?? 'pending']}
                        >
                          {message.status === 'pending' ? (
                            <span className="pending-clock">◷</span>
                          ) : message.status === 'failed' ? (
                            '!'
                          ) : (
                            <>
                              <Icon name="check" size={15} />
                              {['delivered', 'read'].includes(message.status ?? '') && (
                                <Icon name="check" size={15} />
                              )}
                            </>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
        <div ref={bottom} />
      </div>
      <footer className="composer-area">
        {error && (
          <p className="send-error" role="alert">
            {error}
          </p>
        )}
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) void onSend();
          }}
        >
          <textarea
            ref={input}
            aria-label="Сообщение"
            placeholder="Написать сообщение…"
            rows={1}
            value={draft}
            disabled={disabled}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (canSend) void onSend();
              }
            }}
          />
          <button
            className="send-button"
            type="submit"
            disabled={!canSend}
            aria-label="Отправить"
            title={sending ? 'Отправляем…' : 'Отправить'}
          >
            {sending ? <span className="spinner" /> : <Icon name="send" size={24} />}
          </button>
        </form>
        <div className="composer-hint">
          <span>Enter — отправить · Shift + Enter — новая строка</span>
          {draft.length > MAX_MESSAGE_LENGTH - 500 && (
            <span>
              {draft.length} / {MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
      </footer>
    </>
  );
}
