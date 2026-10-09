import {
  CHAT_HISTORY_LIMIT,
  MAX_MESSAGE_LENGTH,
  REQUEST_TIMEOUT_MS,
  RECEIVE_TIMEOUT_SECONDS,
} from '../config';
import type { Credentials, Message, Notification } from '../types';
import { parseHistory, type HistoryMessage } from './history';

const API_URL = 'https://4100.api.green-api.com';

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}

export class GreenApi {
  readonly credentials: Credentials;

  constructor(credentials: Credentials) {
    if (!/^\d+$/.test(credentials.idInstance.trim()) || !credentials.apiTokenInstance.trim()) {
      throw new ApiError('Проверьте ID инстанса и токен.');
    }
    this.credentials = {
      idInstance: credentials.idInstance.trim(),
      apiTokenInstance: credentials.apiTokenInstance.trim(),
    };
  }

  async history(chatId: string, signal?: AbortSignal): Promise<Message[]> {
    const result = await this.request<HistoryMessage[]>('getChatHistory', {
      method: 'POST',
      body: JSON.stringify({ chatId, count: CHAT_HISTORY_LIMIT }),
      signal,
    });
    if (!Array.isArray(result)) throw new ApiError('Не удалось прочитать историю чата.');
    return parseHistory(result, chatId);
  }

  private async request<T>(method: string, options: RequestInit = {}, suffix = ''): Promise<T> {
    const { idInstance, apiTokenInstance } = this.credentials;
    const url = `${API_URL}/waInstance${idInstance}/${method}/${encodeURIComponent(apiTokenInstance)}${suffix}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
          : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new ApiError(
        'Не удалось связаться с GREEN-API. Проверьте соединение и попробуйте ещё раз.',
      );
    }
    if (!response.ok) {
      const errors: Record<number, string> = {
        400: 'GREEN-API отклонил запрос. Проверьте введённые данные.',
        401: 'Неверный ID инстанса или токен. Подключитесь заново.',
        403: 'Нет доступа к инстансу. Проверьте токен и состояние аккаунта.',
        429: 'Слишком много запросов. Попробуйте чуть позже.',
      };
      throw new ApiError(
        errors[response.status] ?? 'GREEN-API временно недоступен. Попробуйте ещё раз.',
        response.status,
      );
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('Не удалось прочитать ответ GREEN-API.');
    }
  }

  async state(signal?: AbortSignal): Promise<string> {
    const result = await this.request<{ stateInstance: string }>('getStateInstance', { signal });
    if (typeof result.stateInstance !== 'string')
      throw new ApiError('Неожиданный ответ GREEN-API.');
    return result.stateInstance;
  }

  async checkAccount(phone: string, signal?: AbortSignal): Promise<string> {
    const result = await this.request<{ exist?: boolean; chatId?: string; status?: boolean }>(
      'checkAccount',
      { method: 'POST', body: JSON.stringify({ phoneNumber: Number(phone) }), signal },
    );
    if (result.status === false)
      throw new ApiError(
        'Не удалось проверить номер. Проверьте авторизацию инстанса или повторите позже.',
      );
    if (result.exist === false) throw new ApiError('Аккаунт MAX с этим номером не найден.');
    if (!result.exist || !result.chatId)
      throw new ApiError('Неожиданный ответ GREEN-API при проверке номера.');
    return result.chatId;
  }

  async send(chatId: string, message: string, signal?: AbortSignal): Promise<string> {
    if (!message.trim() || message.length > MAX_MESSAGE_LENGTH)
      throw new ApiError('Сообщение должно содержать от 1 до 4000 символов.');
    const result = await this.request<{ idMessage: string }>('sendMessage', {
      method: 'POST',
      body: JSON.stringify({ chatId, message }),
      signal,
    });
    if (!result.idMessage)
      throw new ApiError('Неожиданный ответ GREEN-API при отправке сообщения.');
    return result.idMessage;
  }

  async receive(signal?: AbortSignal): Promise<Notification | null> {
    const result = await this.request<Notification | null>(
      'receiveNotification',
      { signal },
      `?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`,
    );
    if (result !== null && (!Number.isFinite(result?.receiptId) || !result?.body))
      throw new ApiError('Неожиданный ответ GREEN-API при получении сообщений.');
    return result;
  }

  async acknowledge(receiptId: number, signal?: AbortSignal): Promise<void> {
    const result = await this.request<{ result: boolean }>(
      'deleteNotification',
      { method: 'DELETE', signal },
      `/${receiptId}`,
    );
    if (!result.result) throw new ApiError('Не удалось подтвердить получение сообщения.');
  }
}
