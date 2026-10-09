import { GreenApi } from '../../shared/api/greenApi';

const SESSION_KEY = 'max-chat.credentials';

export function readSession(): GreenApi | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const credentials: unknown = JSON.parse(saved);
    if (
      !credentials ||
      typeof credentials !== 'object' ||
      !('idInstance' in credentials) ||
      !('apiTokenInstance' in credentials) ||
      typeof credentials.idInstance !== 'string' ||
      typeof credentials.apiTokenInstance !== 'string'
    )
      return null;
    return new GreenApi({
      idInstance: credentials.idInstance,
      apiTokenInstance: credentials.apiTokenInstance,
    });
  } catch {
    return null;
  }
}

export function writeSession(api: GreenApi | null): void {
  try {
    if (api) localStorage.setItem(SESSION_KEY, JSON.stringify(api.credentials));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Если хранилище недоступно, подключение продолжает работать в памяти.
  }
}
