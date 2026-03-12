import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingMessage } from './useLoadingMessage';

describe('useLoadingMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('로딩 시작 시 첫 번째 메시지를 반환한다', () => {
    const { result } = renderHook(() => useLoadingMessage(true));

    expect(result.current).toBe('세금계산서 데이터를 분석하고 있습니다…');
  });

  it('4초 후 두 번째 메시지로 전환된다', () => {
    const { result } = renderHook(() => useLoadingMessage(true));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current).toBe('부가가치세법 관련 조항을 검색하고 있습니다…');
  });

  it('8초 후 세 번째 메시지로 전환된다', () => {
    const { result } = renderHook(() => useLoadingMessage(true));

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(result.current).toBe('거래 유형에 맞는 검토 항목을 확인하고 있습니다…');
  });

  it('16초 후 첫 번째 메시지로 순환한다', () => {
    const { result } = renderHook(() => useLoadingMessage(true));

    act(() => {
      vi.advanceTimersByTime(16000);
    });

    expect(result.current).toBe('세금계산서 데이터를 분석하고 있습니다…');
  });

  it('로딩이 종료되면 첫 번째 메시지로 리셋된다', () => {
    const { result, rerender } = renderHook(({ isLoading }) => useLoadingMessage(isLoading), {
      initialProps: { isLoading: true },
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(result.current).toBe('거래 유형에 맞는 검토 항목을 확인하고 있습니다…');

    rerender({ isLoading: false });

    expect(result.current).toBe('세금계산서 데이터를 분석하고 있습니다…');
  });

  it('로딩이 false이면 타이머가 작동하지 않는다', () => {
    const { result } = renderHook(() => useLoadingMessage(false));

    act(() => {
      vi.advanceTimersByTime(12000);
    });

    expect(result.current).toBe('세금계산서 데이터를 분석하고 있습니다…');
  });

  it('언마운트 시 타이머가 정리된다', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useLoadingMessage(true));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
