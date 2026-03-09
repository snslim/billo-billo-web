import fetch, { type RequestInfo, type RequestInit, type Response } from 'node-fetch';
import { logger } from './logger.js';

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export async function fetchWithRetry(
  url: RequestInfo,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const { maxAttempts = 3, baseDelayMs = 1000, timeoutMs } = options;

  let lastResponse: Response | undefined;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;

      if (timeoutMs) {
        timer = setTimeout(() => controller.abort(), timeoutMs);
      }

      const response = await fetch(url, {
        ...init,
        signal: controller.signal as RequestInit['signal'],
      });

      if (timer) clearTimeout(timer);

      if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
        return response;
      }

      lastResponse = response;
      logger.warn({ attempt, maxAttempts, status: response.status }, '외부 API 재시도 예정');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn({ attempt, maxAttempts, err: lastError }, '외부 API 요청 실패');
    }

    if (attempt < maxAttempts) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error('fetchWithRetry 실패');
}
