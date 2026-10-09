import { useState } from 'react';
import type { GreenApi } from '../shared/api/greenApi';
import { readSession, writeSession } from '../features/auth/session';
import { Login } from '../features/auth/components/Login';
import { ChatSession } from './ChatSession';

export default function App() {
  const [api, setApi] = useState<GreenApi | null>(readSession);
  function connect(next: GreenApi | null) {
    writeSession(next);
    setApi(next);
  }
  return api ? (
    <ChatSession api={api} onLogout={() => connect(null)} />
  ) : (
    <Login onConnect={connect} />
  );
}
