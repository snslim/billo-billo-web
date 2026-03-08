import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, anonymizeInvoiceData } from './formatting';
import type { InvoiceData } from '../types';

describe('formatCurrency', () => {
  it('숫자를 한국 화폐 형식으로 변환한다', () => {
    expect(formatCurrency(1000000)).toBe('1,000,000');
    expect(formatCurrency(500)).toBe('500');
    expect(formatCurrency(1234567)).toBe('1,234,567');
  });

  it('문자열 숫자를 화폐 형식으로 변환한다', () => {
    expect(formatCurrency('1000000')).toBe('1,000,000');
    expect(formatCurrency('1,234,567')).toBe('1,234,567');
  });

  it('0을 처리한다', () => {
    expect(formatCurrency(0)).toBe('0');
    expect(formatCurrency('0')).toBe('0');
  });

  it('음수를 처리한다', () => {
    expect(formatCurrency(-1000)).toBe('-1,000');
  });

  it('유효하지 않은 입력은 빈 문자열을 반환한다', () => {
    expect(formatCurrency('abc')).toBe('');
    expect(formatCurrency('not a number')).toBe('');
  });

  it('빈 문자열을 처리한다', () => {
    expect(formatCurrency('')).toBe('');
  });

  it('문자열 입력에서 쉼표를 제거한다', () => {
    expect(formatCurrency('1,000,000')).toBe('1,000,000');
  });
});

describe('parseCurrency', () => {
  it('형식화된 화폐를 숫자로 파싱한다', () => {
    expect(parseCurrency('1,000,000')).toBe(1000000);
    expect(parseCurrency('500')).toBe(500);
    expect(parseCurrency('1,234,567')).toBe(1234567);
  });

  it('모든 비숫자 문자를 제거한다', () => {
    expect(parseCurrency('1,000,000원')).toBe(1000000);
    expect(parseCurrency('₩ 1,000,000')).toBe(1000000);
    expect(parseCurrency('$1,234.56')).toBe(123456);
  });

  it('유효하지 않은 입력은 0을 반환한다', () => {
    expect(parseCurrency('abc')).toBe(0);
    expect(parseCurrency('not a number')).toBe(0);
    expect(parseCurrency('')).toBe(0);
  });

  it('공백이 포함된 숫자를 처리한다', () => {
    expect(parseCurrency('1 000 000')).toBe(1000000);
  });

  it('0을 처리한다', () => {
    expect(parseCurrency('0')).toBe(0);
  });
});

describe('anonymizeInvoiceData', () => {
  const mockInvoiceData: InvoiceData = {
    docType: 'general',
    isTaxInvoice: true,
    supplierRegNo: '123-45-67890',
    supplierName: '주식회사한국전자',
    receiverRegNo: '098-76-54321',
    date: '2024-12-15',
    supplyAmount: 10000000,
    taxAmount: 1000000,
  };

  it('사업자등록번호를 익명화한다', () => {
    const result = anonymizeInvoiceData(mockInvoiceData);

    expect(result.supplierRegNo).toBe('123-**-*****');
    expect(result.receiverRegNo).toBe('098-**-*****');
  });

  it('공급자명을 익명화한다', () => {
    const result = anonymizeInvoiceData(mockInvoiceData);

    expect(result.supplierName).toBe('주**자');
  });

  it('긴 이름의 첫 글자와 마지막 글자를 유지한다', () => {
    const data = { ...mockInvoiceData, supplierName: '테스트회사' };
    const result = anonymizeInvoiceData(data);

    expect(result.supplierName).toBe('테**사');
  });

  it('짧은 이름(2글자 이하)을 처리한다', () => {
    const data = { ...mockInvoiceData, supplierName: '홍길' };
    const result = anonymizeInvoiceData(data);

    expect(result.supplierName).toBe('**');
  });

  it('한 글자 이름을 처리한다', () => {
    const data = { ...mockInvoiceData, supplierName: '홍' };
    const result = anonymizeInvoiceData(data);

    expect(result.supplierName).toBe('**');
  });

  it('다른 필드는 수정하지 않는다', () => {
    const result = anonymizeInvoiceData(mockInvoiceData);

    expect(result.docType).toBe(mockInvoiceData.docType);
    expect(result.isTaxInvoice).toBe(mockInvoiceData.isTaxInvoice);
    expect(result.date).toBe(mockInvoiceData.date);
    expect(result.supplyAmount).toBe(mockInvoiceData.supplyAmount);
    expect(result.taxAmount).toBe(mockInvoiceData.taxAmount);
  });

  it('원본을 변경하지 않고 새 객체를 생성한다', () => {
    const original = { ...mockInvoiceData };
    const result = anonymizeInvoiceData(mockInvoiceData);

    expect(mockInvoiceData.supplierRegNo).toBe(original.supplierRegNo);
    expect(mockInvoiceData.supplierName).toBe(original.supplierName);
    expect(result).not.toBe(mockInvoiceData);
  });
});
