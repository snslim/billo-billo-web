import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepExtraction } from './StepExtraction';
import type { InvoiceData } from '../types';

describe('StepExtraction', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
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
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  it('데이터가 있을 때 폼을 표시한다', () => {
    render(
      <StepExtraction
        file={mockFile}
        initialData={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('테스트회사')).toBeInTheDocument();
  });

  it('재업로드 버튼을 표시한다', () => {
    render(
      <StepExtraction
        file={mockFile}
        initialData={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('재업로드')).toBeInTheDocument();
  });

  it('검토 완료 버튼을 표시한다', () => {
    render(
      <StepExtraction
        file={mockFile}
        initialData={mockData}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('검토 완료')).toBeInTheDocument();
  });
});
