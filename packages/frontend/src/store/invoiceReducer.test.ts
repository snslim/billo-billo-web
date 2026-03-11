import { describe, it, expect } from 'vitest';
import { invoiceReducer, initialState } from './invoiceReducer';
import { AppStep } from '../types';
import type { InvoiceData, ValidationReport, ReceiverChecklistAnswers } from '../types';
import { DEMO_SCENARIOS } from '../features/upload/data/demoScenarios';

const mockInvoiceData: InvoiceData = {
  docType: 'general',
  isTaxInvoice: true,
  supplierRegNo: '123-45-67890',
  supplierName: '테스트상사',
  receiverRegNo: '098-76-54321',
  receiverName: '수취회사',
  date: '2026-03-01',
  supplyAmount: 1000000,
  taxAmount: 100000,
};

const mockValidationReport: ValidationReport = {
  supplierRegNoValid: { isValid: true, message: '', type: 'success' },
  receiverRegNoValid: { isValid: true, message: '', type: 'success' },
  supplierStatus: { isValid: true, message: '', type: 'success' },
  receiverStatus: { isValid: true, message: '', type: 'success' },
  taxCalculation: { isValid: true, message: '', type: 'success' },
  dateValidity: { isValid: true, message: '', type: 'success' },
};

const mockAnswers: ReceiverChecklistAnswers = {
  purposeForBusiness: 'yes',
  specificNonDeductible: 'no',
  preRegistration: 'no',
};

describe('invoiceReducer', () => {
  it('SELECT_ROLE: 역할을 설정하고 UPLOAD 단계로 이동한다', () => {
    const next = invoiceReducer(initialState, { type: 'SELECT_ROLE', role: 'receiver' });

    expect(next.role).toBe('receiver');
    expect(next.currentStep).toBe(AppStep.UPLOAD);
  });

  it('UPLOAD_FILE: 파일을 저장하고 EXTRACTION 단계로 이동한다', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const state = { ...initialState, currentStep: AppStep.UPLOAD, role: 'receiver' as const };
    const next = invoiceReducer(state, { type: 'UPLOAD_FILE', file });

    expect(next.file).toBe(file);
    expect(next.currentStep).toBe(AppStep.EXTRACTION);
  });

  it('CANCEL_UPLOAD: 파일을 초기화한다', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const state = { ...initialState, file };
    const next = invoiceReducer(state, { type: 'CANCEL_UPLOAD' });

    expect(next.file).toBeNull();
  });

  it('CONFIRM_EXTRACTION: 인보이스 데이터를 저장하고 VALIDATION으로 이동한다', () => {
    const state = { ...initialState, currentStep: AppStep.EXTRACTION };
    const next = invoiceReducer(state, { type: 'CONFIRM_EXTRACTION', data: mockInvoiceData });

    expect(next.invoiceData).toBe(mockInvoiceData);
    expect(next.currentStep).toBe(AppStep.VALIDATION);
  });

  it('CANCEL_EXTRACTION: 파일과 데이터를 초기화하고 UPLOAD로 이동한다', () => {
    const state = {
      ...initialState,
      currentStep: AppStep.EXTRACTION,
      file: new File([''], 'test.jpg'),
      invoiceData: mockInvoiceData,
    };
    const next = invoiceReducer(state, { type: 'CANCEL_EXTRACTION' });

    expect(next.file).toBeNull();
    expect(next.invoiceData).toBeNull();
    expect(next.currentStep).toBe(AppStep.UPLOAD);
  });

  it('PROCEED_TO_ADVISORY: 검증 결과를 저장하고 ADVISORY로 이동한다', () => {
    const state = { ...initialState, currentStep: AppStep.VALIDATION };
    const next = invoiceReducer(state, {
      type: 'PROCEED_TO_ADVISORY',
      report: mockValidationReport,
      answers: mockAnswers,
    });

    expect(next.validationReport).toBe(mockValidationReport);
    expect(next.userAnswers).toBe(mockAnswers);
    expect(next.currentStep).toBe(AppStep.ADVISORY);
  });

  it('RESET: 모든 상태를 초기값으로 되돌린다', () => {
    const state = {
      ...initialState,
      currentStep: AppStep.ADVISORY,
      role: 'supplier' as const,
      invoiceData: mockInvoiceData,
      validationReport: mockValidationReport,
      userAnswers: mockAnswers,
    };
    const next = invoiceReducer(state, { type: 'RESET' });

    expect(next).toEqual(initialState);
  });

  it('GO_BACK: 이전 단계로 이동하되 데이터는 보존한다', () => {
    const state = {
      ...initialState,
      currentStep: AppStep.VALIDATION,
      role: 'receiver' as const,
      invoiceData: mockInvoiceData,
    };
    const next = invoiceReducer(state, { type: 'GO_BACK' });

    expect(next.currentStep).toBe(AppStep.EXTRACTION);
    expect(next.invoiceData).toBe(mockInvoiceData);
    expect(next.role).toBe('receiver');
  });

  it('GO_BACK: ROLE_SELECTION에서는 이동하지 않는다', () => {
    const next = invoiceReducer(initialState, { type: 'GO_BACK' });

    expect(next.currentStep).toBe(AppStep.ROLE_SELECTION);
  });

  describe('SELECT_DEMO', () => {
    const demoScenario = DEMO_SCENARIOS[0];

    it('isDemo를 true로 설정하고 시나리오를 저장한다', () => {
      const state = { ...initialState, currentStep: AppStep.UPLOAD, role: 'receiver' as const };
      const next = invoiceReducer(state, { type: 'SELECT_DEMO', scenario: demoScenario });

      expect(next.isDemo).toBe(true);
      expect(next.demoScenario).toBe(demoScenario);
    });

    it('시나리오의 invoiceData를 상태에 복사한다', () => {
      const state = { ...initialState, currentStep: AppStep.UPLOAD, role: 'receiver' as const };
      const next = invoiceReducer(state, { type: 'SELECT_DEMO', scenario: demoScenario });

      expect(next.invoiceData).toEqual(demoScenario.invoiceData);
    });

    it('EXTRACTION 단계로 이동한다', () => {
      const state = { ...initialState, currentStep: AppStep.UPLOAD, role: 'receiver' as const };
      const next = invoiceReducer(state, { type: 'SELECT_DEMO', scenario: demoScenario });

      expect(next.currentStep).toBe(AppStep.EXTRACTION);
    });

    it('RESET하면 데모 상태도 초기화된다', () => {
      const state = {
        ...initialState,
        isDemo: true,
        demoScenario,
        invoiceData: demoScenario.invoiceData,
        currentStep: AppStep.ADVISORY,
      };
      const next = invoiceReducer(state, { type: 'RESET' });

      expect(next.isDemo).toBe(false);
      expect(next.demoScenario).toBeNull();
    });
  });
});
