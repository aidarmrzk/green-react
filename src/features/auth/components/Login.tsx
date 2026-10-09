import { useEffect, useRef, useState } from 'react';
import { GreenApi } from '../../../shared/api/greenApi';
import { Icon } from '../../../shared/ui/Icon';

export function Login({ onConnect }: { onConnect: (api: GreenApi) => void }) {
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const api = new GreenApi({ idInstance: id, apiTokenInstance: token });
      const state = await api.state(abort.signal);
      if (abort.signal.aborted) return;
      if (state !== 'authorized')
        throw new Error(
          'Инстанс не авторизован в MAX. Подключите аккаунт в личном кабинете GREEN-API.',
        );
      onConnect(api);
    } catch (failure) {
      if (!abort.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Не удалось подключиться.');
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }

  return (
    <main className="login-page wallpaper">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          <Icon name="chat" size={36} />
        </div>
        <span className="login-brand">MAX</span>
        <h1 id="login-title">Ваши сообщения — здесь</h1>
        <p className="login-intro">
          Подключите аккаунт через GREEN-API,
          <br />
          чтобы начать переписку.
        </p>
        <form onSubmit={connect} className="login-form">
          <label htmlFor="instance">ID инстанса</label>
          <input
            id="instance"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Например, 4100123456"
            required
            value={id}
            onChange={(event) => setId(event.target.value)}
            disabled={busy}
          />
          <label htmlFor="token">Токен API</label>
          <div className="password-field">
            <input
              id="token"
              type={showToken ? 'text' : 'password'}
              autoComplete="off"
              placeholder="apiTokenInstance"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              disabled={busy}
            />
            <button
              className="icon-button"
              type="button"
              aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
              aria-pressed={showToken}
              onClick={() => setShowToken(!showToken)}
            >
              <Icon name="eye" />
            </button>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? 'Подключаемся…' : 'Подключиться'}
          </button>
        </form>
        <p className="login-help">
          Данные подключения — в{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            личном кабинете GREEN-API
          </a>
          .
        </p>
        <p className="login-note">Подключение сохранится в этом браузере до выхода.</p>
      </section>
      <span className="login-footer">Текстовый чат для MAX</span>
    </main>
  );
}
