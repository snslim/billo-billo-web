import { describe, it, expect, vi } from 'vitest';
import { getRAGSystemPrompt } from './geminiService';
import type { ReceiverChecklistAnswers, SupplierChecklistAnswers } from '../types';

vi.mock('../config', () => ({
  config: { api: { baseUrl: 'http://localhost:3000', timeout: 10000 } },
}));

// getRAGSystemPrompt에 전달할 공통 인자
const dataJson = '{}';
const issues = '특이사항 없음';
const legalContext = '';

// 매입자 기본 응답 (모두 unanswered)
const receiverDefaults: ReceiverChecklistAnswers = {
  purposeForBusiness: 'unanswered',
  specificNonDeductible: 'unanswered',
  preRegistration: 'unanswered',
};

// 공급자 기본 응답 (모두 unanswered)
const supplierDefaults: SupplierChecklistAnswers = {
  requiredFieldsCorrect: 'unanswered',
  issuedOnTime: 'unanswered',
  isZeroRate: 'unanswered',
  needsCorrection: 'unanswered',
  transmittedOnTime: 'unanswered',
  summaryTableReady: 'unanswered',
};

describe('getRAGSystemPrompt — 매입자 분기', () => {
  it('purposeForBusiness === "no"이면 impossible 지시문을 포함한다', () => {
    const answers: ReceiverChecklistAnswers = { ...receiverDefaults, purposeForBusiness: 'no' };
    const prompt = getRAGSystemPrompt('receiver', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('impossible');
    expect(prompt).toContain('사업과 직접 관련이 없');
  });

  it('specificNonDeductible === "yes"이면 불공제 지시문을 포함한다', () => {
    const answers: ReceiverChecklistAnswers = { ...receiverDefaults, specificNonDeductible: 'yes' };
    const prompt = getRAGSystemPrompt('receiver', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('impossible');
    expect(prompt).toContain('접대비');
  });

  it('preRegistration === "yes"이면 시행령 §75 예외 규정을 포함한다', () => {
    const answers: ReceiverChecklistAnswers = { ...receiverDefaults, preRegistration: 'yes' };
    const prompt = getRAGSystemPrompt('receiver', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('시행령 제75조');
    expect(prompt).toContain('20일 이내');
  });
});

describe('getRAGSystemPrompt — 공급자 분기', () => {
  it('requiredFieldsCorrect === "no"이면 수정세금계산서 지시문을 포함한다', () => {
    const answers: SupplierChecklistAnswers = { ...supplierDefaults, requiredFieldsCorrect: 'no' };
    const prompt = getRAGSystemPrompt('supplier', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('수정세금계산서');
    expect(prompt).toContain('§32④');
  });

  it('issuedOnTime === "no"이면 지연발급 1% 가산세 경고를 포함한다', () => {
    const answers: SupplierChecklistAnswers = { ...supplierDefaults, issuedOnTime: 'no' };
    const prompt = getRAGSystemPrompt('supplier', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('지연발급');
    expect(prompt).toContain('1%');
    expect(prompt).toContain('§60②');
  });

  it('transmittedOnTime === "no"이면 전송 기한 가산세 경고를 포함한다', () => {
    const answers: SupplierChecklistAnswers = { ...supplierDefaults, transmittedOnTime: 'no' };
    const prompt = getRAGSystemPrompt('supplier', dataJson, issues, legalContext, answers);

    expect(prompt).toContain('전송 기한');
    expect(prompt).toContain('시행령 §68');
  });
});
