import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StepAdvisory } from './StepAdvisory';
import type {
  InvoiceData,
  ValidationReport,
  AIAdvisoryResponse,
  ReceiverChecklistAnswers,
  SupplierChecklistAnswers,
} from '../../../types';
import * as geminiService from '../services/geminiService';
import type { LegalReference } from '../data/legalKnowledge';

vi.mock('../../../config', () => ({
  config: { api: { baseUrl: 'http://localhost:3000', timeout: 10000 } },
}));
vi.mock('../services/geminiService');

const mockData: InvoiceData = {
  docType: 'general',
  isTaxInvoice: true,
  supplierRegNo: '123-45-67890',
  supplierName: '테스트회사',
  receiverRegNo: '098-76-54321',
  date: '2024-12-15',
  supplyAmount: 1000000,
  taxAmount: 100000,
};

const mockReport: ValidationReport = {
  supplierRegNoValid: { isValid: true, message: '유효', type: 'success' },
  receiverRegNoValid: { isValid: true, message: '유효', type: 'success' },
  supplierStatus: { isValid: true, message: '정상', type: 'success' },
  receiverStatus: { isValid: true, message: '정상', type: 'success' },
  taxCalculation: { isValid: true, message: '일치', type: 'success' },
  dateValidity: { isValid: true, message: '유효', type: 'success' },
};

const mockAdvisory: AIAdvisoryResponse = {
  summary: '테스트 분석 요약입니다.',
  checklists: ['공제 요건 확인 1', '공제 요건 확인 2'],
  warnings: ['주의사항 1'],
  deductionStatus: 'possible',
};

const mockReferences: LegalReference[] = [
  {
    id: 'vat-32',
    source: '부가가치세법 제32조',
    content: '세금계산서 필요적 기재사항',
    tags: ['기재사항'],
    applicableRoles: ['supplier'],
    roleWeight: 0.25,
    category: 'issuance',
  },
];

const receiverAnswers: ReceiverChecklistAnswers = {
  purposeForBusiness: 'yes',
  specificNonDeductible: 'no',
  preRegistration: 'not_applicable',
};

const supplierAnswers: SupplierChecklistAnswers = {
  issuedOnTime: 'yes',
  requiredFieldsComplete: 'yes',
  matchesActualTransaction: 'yes',
};

describe('StepAdvisory', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 중 스켈레톤 UI를 표시한다', () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockReturnValue(new Promise(() => {}));

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText('매입자(수취인) 공제 체크리스트')).toBeInTheDocument();
    expect(screen.getByText('관련 법적 근거')).toBeInTheDocument();
  });

  it('AI 조언 결과를 정상적으로 렌더링한다', async () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockResolvedValue({
      advisory: mockAdvisory,
      references: mockReferences,
      isMock: false,
    });

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 분석 요약입니다.')).toBeInTheDocument();
    });

    expect(screen.getByText('공제 요건 확인 1')).toBeInTheDocument();
    expect(screen.getByText('공제 요건 확인 2')).toBeInTheDocument();
    expect(screen.getByText('부가가치세법 제32조')).toBeInTheDocument();
  });

  it('supplier 역할에서 warnings를 표시한다', async () => {
    const supplierAdvisory: AIAdvisoryResponse = {
      ...mockAdvisory,
      warnings: ['지연발급 가산세 주의'],
      checklists: [],
    };

    vi.spyOn(geminiService, 'getTaxAdvice').mockResolvedValue({
      advisory: supplierAdvisory,
      references: mockReferences,
      isMock: false,
    });

    render(
      <StepAdvisory
        data={mockData}
        role="supplier"
        validationReport={mockReport}
        userAnswers={supplierAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('매출자(공급자) 신고 가이드')).toBeInTheDocument();
    });

    expect(screen.getByText('지연발급 가산세 주의')).toBeInTheDocument();
  });

  it('API 실패 시 에러 UI와 재시도 버튼을 표시한다', async () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockRejectedValue(new Error('API Error'));

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('AI 조언을 생성하지 못했습니다')).toBeInTheDocument();
    });

    expect(screen.getByText('다시 시도')).toBeInTheDocument();
    expect(screen.getByText('처음부터 다시 시작')).toBeInTheDocument();
  });

  it('재시도 버튼 클릭 시 getTaxAdvice를 다시 호출한다', async () => {
    const getTaxAdviceSpy = vi
      .spyOn(geminiService, 'getTaxAdvice')
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        advisory: mockAdvisory,
        references: mockReferences,
        isMock: false,
      });

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('다시 시도'));

    await waitFor(() => {
      expect(getTaxAdviceSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('mock 응답 시 경고 배너를 표시한다', async () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockResolvedValue({
      advisory: mockAdvisory,
      references: mockReferences,
      isMock: true,
    });

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/AI 서버 연결에 실패하여/)).toBeInTheDocument();
    });
  });

  it('onReset 클릭 시 콜백이 호출된다', async () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockResolvedValue({
      advisory: mockAdvisory,
      references: mockReferences,
      isMock: false,
    });

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('새로운 문서 검토하기')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('새로운 문서 검토하기'));
    expect(mockOnReset).toHaveBeenCalled();
  });

  it('법적 근거가 없으면 빈 메시지를 표시한다', async () => {
    vi.spyOn(geminiService, 'getTaxAdvice').mockResolvedValue({
      advisory: mockAdvisory,
      references: [],
      isMock: false,
    });

    render(
      <StepAdvisory
        data={mockData}
        role="receiver"
        validationReport={mockReport}
        userAnswers={receiverAnswers}
        onReset={mockOnReset}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('인용된 법령이 없습니다.')).toBeInTheDocument();
    });
  });
});
