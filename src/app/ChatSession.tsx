import { useState } from 'react';
import type { GreenApi } from '../shared/api/greenApi';
import { useChat } from '../features/chat/hooks/useChat';
import { Sidebar } from '../features/chat/components/Sidebar';
import { Conversation } from '../features/chat/components/Conversation';
import { NewChat } from '../features/chat/components/NewChat';
import { Icon } from '../shared/ui/Icon';

export function ChatSession({ api, onLogout }: { api: GreenApi; onLogout: () => void }) {
  const chat = useChat(api);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const selected = chat.chats.find((item) => item.id === chat.selectedId);
  return (
    <main className={`chat-app ${selected ? 'has-selection' : ''}`}>
      <Sidebar
        chats={chat.chats}
        selectedId={chat.selectedId}
        onSelect={chat.selectChat}
        onNew={() => setNewChatOpen(true)}
        onLogout={onLogout}
        connectionError={chat.connectionError}
      />
      <section className="conversation wallpaper" aria-label="Чат">
        {chat.connectionError && (
          <div className="connection-banner" role="status">
            <span>
              {chat.connectionError}
              {!chat.fatal && ' Восстанавливаем соединение…'}
            </span>
            {chat.fatal && <button onClick={onLogout}>Подключиться заново</button>}
          </div>
        )}
        {selected ? (
          <Conversation
            chat={selected}
            draft={chat.draft}
            onDraft={chat.setDraft}
            onSend={chat.sendMessage}
            onBack={() => chat.selectChat(null)}
            sending={chat.sending}
            error={chat.sendError}
            disabled={chat.fatal}
            historyLoading={chat.historyLoading}
            historyError={chat.historyError}
            onReloadHistory={chat.reloadHistory}
          />
        ) : (
          <div className="empty-conversation">
            <span className="empty-conversation-icon">
              <Icon name="chat" size={44} />
            </span>
            <h2>Начните общение</h2>
            <p>
              Выберите чат слева или напишите
              <br />
              по номеру телефона.
            </p>
            <button className="primary-button" onClick={() => setNewChatOpen(true)}>
              <Icon name="plus" size={18} />
              Новый чат
            </button>
          </div>
        )}
      </section>
      {newChatOpen && <NewChat onCreate={chat.createChat} onClose={() => setNewChatOpen(false)} />}
    </main>
  );
}
