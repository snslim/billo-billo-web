import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, formatDateToKorean, getTodayString } from './invoiceHelpers';

describe('formatCurrency', () => {
  it('숫자를 한국 화폐 형식으로 변환한다', () => {
    expect(formatCurrency(1000000)).toBe('1,000,000');
    expect(formatCurrency(500)).toBe('500');
  });

  it('문자열을 화폐 형식으로 변환한다', () => {
    expect(formatCurrency('1000000')).toBe('1,000,000');
  });

  it('유효하지 않은 입력은 "0"을 반환한다', () => {
    expect(formatCurrency('abc')).toBe('0');
    expect(formatCurrency(NaN)).toBe('0');
  });

  it('0을 처리한다', () => {
    expect(formatCurrency(0)).toBe('0');
    expect(formatCurrency('0')).toBe('0');
  });
});

describe('parseCurrency', () => {
  it('형식화된 화폐를 파싱한다', () => {
    expect(parseCurrency('1,000,000')).toBe(1000000);
    expect(parseCurrency('500')).toBe(500);
  });

  it('유효하지 않은 입력은 0을 반환한다', () => {
    expect(parseCurrency('abc')).toBe(0);
    expect(parseCurrency('')).toBe(0);
  });

  it('쉼표를 제거한다', () => {
    expect(parseCurrency('1,234,567')).toBe(1234567);
  });
});

describe('formatDateToKorean', () => {
  it('YYYY-MM-DD 형식을 한국어로 변환한다', () => {
    expect(formatDateToKorean('2024-12-15')).toBe('2024년 12월 15일');
    expect(formatDateToKorean('2024-01-01')).toBe('2024년 01월 01일');
  });

  it('빈 입력은 빈 문자열을 반환한다', () => {
    expect(formatDateToKorean('')).toBe('');
  });

  it('다양한 날짜 형식을 처리한다', () => {
    expect(formatDateToKorean('2024-3-5')).toBe('2024년 3월 5일');
  });
});

describe('getTodayString', () => {
  it('YYYY-MM-DD 형식으로 날짜를 반환한다', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('오늘 날짜를 반환한다', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(getTodayString()).toBe(expected);
  });

  it('월과 일을 0으로 패딩한다', () => {
    const result = getTodayString();
    const parts = result.split('-');
    expect(parts[1].length).toBe(2);
    expect(parts[2].length).toBe(2);
  });
});
