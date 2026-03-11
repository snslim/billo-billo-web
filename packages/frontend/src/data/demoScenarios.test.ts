import { describe, it, expect } from 'vitest';
import { DEMO_SCENARIOS } from './demoScenarios';
import type { InvoiceData } from '../types';

const isValidRegNo = (num: string): boolean => {
  const cleaned = num.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }
  sum += Math.floor((parseInt(cleaned.charAt(8)) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleaned.charAt(9));
};

const INVOICE_REQUIRED_KEYS: (keyof InvoiceData)[] = [
  'docType',
  'isTaxInvoice',
  'supplierRegNo',
  'supplierName',
  'receiverRegNo',
  'date',
  'supplyAmount',
  'taxAmount',
];

describe('demoScenarios 데이터 무결성', () => {
  it('시나리오 ID가 모두 고유하다', () => {
    const ids = DEMO_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 시나리오가 유효한 role을 가진다', () => {
    DEMO_SCENARIOS.forEach((s) => {
      expect(['supplier', 'receiver']).toContain(s.role);
    });
  });

  it('매입자(receiver) 시나리오가 최소 3개 존재한다', () => {
    const receiverScenarios = DEMO_SCENARIOS.filter((s) => s.role === 'receiver');
    expect(receiverScenarios.length).toBeGreaterThanOrEqual(3);
  });

  it('공급자(supplier) 시나리오가 최소 1개 존재한다', () => {
    const supplierScenarios = DEMO_SCENARIOS.filter((s) => s.role === 'supplier');
    expect(supplierScenarios.length).toBeGreaterThanOrEqual(1);
  });

  describe('invoiceData 필수 필드', () => {
    DEMO_SCENARIOS.forEach((scenario) => {
      it(`${scenario.name}: 필수 필드가 모두 존재한다`, () => {
        INVOICE_REQUIRED_KEYS.forEach((key) => {
          expect(scenario.invoiceData).toHaveProperty(key);
        });
      });

      it(`${scenario.name}: docType이 general이다`, () => {
        expect(scenario.invoiceData.docType).toBe('general');
      });

      it(`${scenario.name}: 공급가액과 세액이 0보다 크다`, () => {
        expect(scenario.invoiceData.supplyAmount).toBeGreaterThan(0);
        expect(scenario.invoiceData.taxAmount).toBeGreaterThan(0);
      });
    });
  });

  describe('사업자등록번호 체크섬', () => {
    DEMO_SCENARIOS.forEach((scenario) => {
      it(`${scenario.name}: supplierRegNo 체크섬 통과`, () => {
        expect(isValidRegNo(scenario.invoiceData.supplierRegNo)).toBe(true);
      });

      it(`${scenario.name}: receiverRegNo 체크섬 통과`, () => {
        expect(isValidRegNo(scenario.invoiceData.receiverRegNo)).toBe(true);
      });
    });
  });

  describe('suggestedAnswers', () => {
    DEMO_SCENARIOS.forEach((scenario) => {
      it(`${scenario.name}: suggestedAnswers 값이 yes 또는 no이다`, () => {
        Object.values(scenario.suggestedAnswers).forEach((val) => {
          expect(['yes', 'no']).toContain(val);
        });
      });
    });
  });
});
