import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

import { fetchWithRetry } from './retry.js';

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockClear();
  });

  afterEach(async () => {
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  it('성공 응답을 즉시 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    const response = await fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 3,
      baseDelayMs: 1000,
    });

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('비-retryable 에러 상태는 재시도하지 않고 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

    const response = await fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 3,
      baseDelayMs: 1000,
    });

    expect(response.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retryable 상태 코드에서 지수 백오프로 재시도한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 3,
      baseDelayMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    const response = await promise;

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('모든 재시도 실패 시 마지막 응답을 반환한다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    const promise = fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 3,
      baseDelayMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    const response = await promise;

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('네트워크 오류 시 재시도 후 에러를 throw한다', async () => {
    vi.useRealTimers();

    mockFetch
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockRejectedValueOnce(new Error('네트워크 오류'));

    await expect(
      fetchWithRetry('https://example.com', undefined, {
        maxAttempts: 2,
        baseDelayMs: 10,
      })
    ).rejects.toThrow('네트워크 오류');

    expect(mockFetch).toHaveBeenCalledTimes(2);

    vi.useFakeTimers();
  });

  it('maxAttempts=1이면 재시도하지 않는다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const response = await fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 1,
    });

    expect(response.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('첫 시도 실패 후 두 번째 시도에서 성공한다', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('일시적 오류'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const promise = fetchWithRetry('https://example.com', undefined, {
      maxAttempts: 3,
      baseDelayMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);

    const response = await promise;

    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
