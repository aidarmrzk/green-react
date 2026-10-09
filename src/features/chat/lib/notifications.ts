import { ApiError, type GreenApi } from '../../../shared/api/greenApi';
import type { Notification } from '../../../shared/types';

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}

export async function pollNotifications(
  api: GreenApi,
  signal: AbortSignal,
  onNotification: (notification: Notification) => boolean | void | Promise<boolean | void>,
  onConnection: (error: string | null, fatal?: boolean) => void,
): Promise<void> {
  let failures = 0;
  while (!signal.aborted) {
    try {
      const notification = await api.receive(signal);
      if (signal.aborted) break;
      if (notification) {
        const keepReceiving = await onNotification(notification);
        if (signal.aborted) break;
        await api.acknowledge(notification.receiptId, signal);
        if (keepReceiving === false) break;
      }
      if (signal.aborted) break;
      failures = 0;
      onConnection(null);
      if (!notification) await delay(250, signal);
    } catch (error) {
      if (signal.aborted) break;
      const fatal = error instanceof ApiError && [401, 403].includes(error.status);
      onConnection(
        error instanceof Error ? error.message : 'Не удалось получить сообщения.',
        fatal,
      );
      if (fatal) break;
      await delay(Math.min(1000 * 2 ** failures++, 15000), signal);
    }
  }
}
