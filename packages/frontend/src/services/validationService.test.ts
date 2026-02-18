import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateInvoiceAsync } from './validationService';
import type { InvoiceData, UserRole } from '../types';

vi.mock('../config', () => ({
  config: {
    api: {
      baseUrl: 'http://localhost:3000',
      timeout: 30000
    }
  }
}));

global.fetch = vi.fn();

describe('validateInvoiceAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] })
    });
  });

  const basicInvoiceData: InvoiceData = {
    docType: 'general',
    isTaxInvoice: true,
    supplierRegNo: '123-45-67890',
    supplierName: '주식회사빌런즈',
    receiverRegNo: '098-76-54321',
    date: '2024-12-15',
    supplyAmount: 10000000,
    taxAmount: 1000000
  };

  const userRole: UserRole = 'receiver';

  describe('세액 계산 검증', () => {
    it('정확한 10% 세액을 허용한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 5000000, taxAmount: 500000 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(true);
      expect(result.taxCalculation.message).toBe('세액 계산 일치');
    });

    it('10원 오차 범위 내 세액을 허용한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 5000000, taxAmount: 500005 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(true);
    });

    it('잘못된 세액을 거부한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 5000000, taxAmount: 600000 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(false);
      expect(result.taxCalculation.message).toContain('세액 불일치');
    });

    it('음수 공급가액을 거부한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: -1000, taxAmount: 100 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(false);
      expect(result.taxCalculation.message).toContain('음수 불가');
    });

    it('음수 세액을 거부한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 1000, taxAmount: -100 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(false);
      expect(result.taxCalculation.message).toContain('음수 불가');
    });

    it('0 금액을 처리한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 0, taxAmount: 0 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(true);
    });

    it('예상 세액을 올바르게 계산한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 1234567, taxAmount: 200000 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation.isValid).toBe(false);
      expect(result.taxCalculation.message).toContain('123,456');
    });
  });

  describe('날짜 검증', () => {
    it('유효한 과거 날짜를 허용한다', async () => {
      const data = { ...basicInvoiceData, date: '2024-01-01' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(true);
      expect(result.dateValidity.message).toContain('작성연월일 식별됨');
    });

    it('오늘 날짜를 허용한다', async () => {
      const today = new Date().toISOString().split('T')[0];
      const data = { ...basicInvoiceData, date: today };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(true);
    });

    it('미래 날짜를 거부한다', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const data = {
        ...basicInvoiceData,
        date: futureDate.toISOString().split('T')[0]
      };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(false);
      expect(result.dateValidity.message).toContain('미래');
    });

    it('유효하지 않은 날짜 형식을 거부한다', async () => {
      const data = { ...basicInvoiceData, date: 'invalid-date' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(false);
      expect(result.dateValidity.message).toContain('날짜 형식 오류');
    });

    it('잘못된 날짜를 거부한다', async () => {
      const data = { ...basicInvoiceData, date: '2024-13-45' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(false);
    });
  });

  describe('사업자등록번호 형식 검증', () => {
    it('10자리가 아닌 형식을 거부한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '123-45-678' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.supplierRegNoValid.isValid).toBe(false);
      expect(result.supplierRegNoValid.message).toContain('형식이 올바르지 않습니다');
    });

    it('너무 짧은 번호를 거부한다', async () => {
      const data = { ...basicInvoiceData, receiverRegNo: '12345' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.receiverRegNoValid.isValid).toBe(false);
    });

    it('너무 긴 번호를 거부한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '123-45-678901' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.supplierRegNoValid.isValid).toBe(false);
    });

    it('빈 등록번호를 거부한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.supplierRegNoValid.isValid).toBe(false);
    });

    it('검증 전 하이픈을 제거한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '1-2-3-4-5-6-7-8-9-0' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.supplierRegNoValid).toBeDefined();
    });
  });

  describe('검증 보고서 구조', () => {
    it('필요한 모든 검증 필드를 반환한다', async () => {
      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(result).toHaveProperty('supplierRegNoValid');
      expect(result).toHaveProperty('receiverRegNoValid');
      expect(result).toHaveProperty('supplierStatus');
      expect(result).toHaveProperty('receiverStatus');
      expect(result).toHaveProperty('taxCalculation');
      expect(result).toHaveProperty('dateValidity');
    });

    it('결과에 검증 유형을 포함한다', async () => {
      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(['success', 'error', 'warning', 'loading']).toContain(result.taxCalculation.type);
      expect(['success', 'error', 'warning', 'loading']).toContain(result.dateValidity.type);
    });

    it('모든 검증 결과에 메시지를 포함한다', async () => {
      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(result.supplierRegNoValid.message).toBeTruthy();
      expect(result.taxCalculation.message).toBeTruthy();
      expect(result.dateValidity.message).toBeTruthy();
    });
  });

  describe('API 통합', () => {
    it('검증을 완료한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '1234567890', receiverRegNo: '0987654321' };

      const result = await validateInvoiceAsync(data, userRole);

      expect(result).toBeDefined();
      expect(result.taxCalculation).toBeDefined();
    });

    it('API 타임아웃을 처리한다', async () => {
      (fetch as any).mockRejectedValue({ name: 'AbortError' });

      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(result.taxCalculation.isValid).toBe(true);
      expect(result.dateValidity.isValid).toBe(true);
    });

    it('API 오류 응답을 처리한다', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(result).toBeDefined();
    });

    it('네트워크 오류를 처리한다', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await validateInvoiceAsync(basicInvoiceData, userRole);

      expect(result.taxCalculation.isValid).toBe(true);
    });
  });

  describe('엣지 케이스', () => {
    it('매우 큰 금액을 처리한다', async () => {
      const data = { ...basicInvoiceData, supplyAmount: 999999999999, taxAmount: 99999999999 };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.taxCalculation).toBeDefined();
    });

    it('매우 오래된 날짜를 처리한다', async () => {
      const data = { ...basicInvoiceData, date: '2000-01-01' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.dateValidity.isValid).toBe(true);
    });

    it('등록번호의 특수문자를 처리한다', async () => {
      const data = { ...basicInvoiceData, supplierRegNo: '!@#$%^&*()' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.supplierRegNoValid.isValid).toBe(false);
    });

    it('문자로 된 등록번호를 처리한다', async () => {
      const data = { ...basicInvoiceData, receiverRegNo: 'abcdefghij' };
      const result = await validateInvoiceAsync(data, userRole);

      expect(result.receiverRegNoValid.isValid).toBe(false);
    });
  });
});
