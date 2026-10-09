import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';

export function NewChat({
  onCreate,
  onClose,
}: {
  onCreate: (phone: string) => Promise<void>;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector('input')?.focus();
    return () => element?.close();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onCreate(phone);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось создать чат.');
      setBusy(false);
    }
  }
  return (
    <dialog
      className="new-chat-dialog"
      ref={dialog}
      aria-labelledby="new-chat-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !busy) onClose();
      }}
    >
      <div className="dialog-content">
        <header>
          <h2 id="new-chat-title">Новый чат</h2>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть" disabled={busy}>
            <Icon name="close" />
          </button>
        </header>
        <p>
          Введите номер собеседника, который
          <br />
          пользуется MAX.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="recipient">Номер телефона</label>
          <input
            id="recipient"
            type="tel"
            autoComplete="tel"
            placeholder="+7 999 123-45-67"
            autoFocus
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={busy}
          />
          <span className="input-hint">С кодом страны: +7 или +375</span>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? 'Проверяем номер…' : 'Создать чат'}
          </button>
        </form>
      </div>
    </dialog>
  );
}
