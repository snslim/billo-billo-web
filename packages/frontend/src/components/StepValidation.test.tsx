import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StepValidation } from './StepValidation';
import type { InvoiceData, ValidationReport } from '../types';
import * as validationService from '../services/validationService';
import { SUPPLIER_CHECKLIST, RECEIVER_CHECKLIST } from '../data/checklist';

vi.mock('../config', () => ({
  config: { api: { baseUrl: 'http://localhost:3000', timeout: 10000 } },
}));
vi.mock('../services/validationService');

describe('StepValidation', () => {
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

  const mockOnProceed = vi.fn();

  beforeEach(() => {
    vi.spyOn(validationService, 'validateInvoiceAsync').mockResolvedValue(mockReport);
  });

  it('마운트 시 검증 함수를 호출한다', async () => {
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(validationService.validateInvoiceAsync).toHaveBeenCalledWith(mockData, 'receiver', {
        isDemo: false,
      });
    });
  });

  it('자동 확인 항목 2개를 렌더링한다', async () => {
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(screen.getByText('상대방 사업자 상태')).toBeInTheDocument();
      expect(screen.getByText('필요적 기재사항')).toBeInTheDocument();
    });
  });

  it('매입자 역할 시 3개 체크리스트 항목을 렌더링한다', async () => {
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      for (const item of RECEIVER_CHECKLIST) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    });

    // 공급자 전용 항목은 렌더되지 않아야 함
    for (const item of SUPPLIER_CHECKLIST) {
      expect(screen.queryByText(item.title)).not.toBeInTheDocument();
    }
  });

  it('공급자 역할 시 6개 체크리스트 항목을 렌더링한다', async () => {
    render(
      <StepValidation data={mockData} role="supplier" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      for (const item of SUPPLIER_CHECKLIST) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    });

    // 매입자 전용 항목은 렌더되지 않아야 함
    for (const item of RECEIVER_CHECKLIST) {
      expect(screen.queryByText(item.title)).not.toBeInTheDocument();
    }
  });

  it('예 버튼 클릭 시 선택 상태로 전환된다', async () => {
    const user = userEvent.setup();
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(screen.getByText(RECEIVER_CHECKLIST[0].title)).toBeInTheDocument();
    });

    // 첫 번째 체크리스트의 "예" 버튼 클릭
    const yesButtons = screen.getAllByText('예');
    await user.click(yesButtons[0]);

    // 클릭 후 버튼이 활성 스타일을 가짐
    await waitFor(() => {
      expect(screen.getAllByText('예')[0].className).toContain('bg-blue-600');
    });
  });

  it('아니오 버튼 클릭 시 선택 상태로 전환된다', async () => {
    const user = userEvent.setup();
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(screen.getByText(RECEIVER_CHECKLIST[0].title)).toBeInTheDocument();
    });

    const noButtons = screen.getAllByText('아니오');
    await user.click(noButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('아니오')[0].className).toContain('bg-slate-600');
    });
  });

  it('선택된 버튼을 다시 클릭하면 미응답으로 돌아간다', async () => {
    const user = userEvent.setup();
    render(
      <StepValidation data={mockData} role="receiver" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(screen.getByText(RECEIVER_CHECKLIST[0].title)).toBeInTheDocument();
    });

    // 클릭 → 선택
    await user.click(screen.getAllByText('예')[0]);
    await waitFor(() => {
      expect(screen.getAllByText('예')[0].className).toContain('bg-blue-600');
    });

    // 같은 버튼 다시 클릭 → 해제
    await user.click(screen.getAllByText('예')[0]);
    await waitFor(() => {
      expect(screen.getAllByText('예')[0].className).not.toContain('bg-blue-600');
    });
  });

  it('영세율 세금계산서일 때 isZeroRate 항목에 하이라이트가 표시된다', async () => {
    const zeroRateData: InvoiceData = { ...mockData, docType: 'zero_rate' };
    render(
      <StepValidation
        data={zeroRateData}
        role="supplier"
        isDemo={false}
        onProceed={mockOnProceed}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/영세율로 발급되었습니다/)).toBeInTheDocument();
    });
  });

  it('일반 세금계산서일 때 영세율 하이라이트가 표시되지 않는다', async () => {
    render(
      <StepValidation data={mockData} role="supplier" isDemo={false} onProceed={mockOnProceed} />
    );

    await waitFor(() => {
      expect(screen.getByText(SUPPLIER_CHECKLIST[0].title)).toBeInTheDocument();
    });

    expect(screen.queryByText(/영세율로 발급되었습니다/)).not.toBeInTheDocument();
  });
});
