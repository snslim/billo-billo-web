import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { StepValidation } from './StepValidation';
import type { InvoiceData, ValidationReport } from '../types';
import * as validationService from '../services/validationService';

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

  it('마운트 시 검증 함수를 호출한다', async () => {
    const validateSpy = vi
      .spyOn(validationService, 'validateInvoiceAsync')
      .mockResolvedValue(mockReport);

    render(<StepValidation data={mockData} role="receiver" onProceed={mockOnProceed} />);

    await waitFor(() => {
      expect(validateSpy).toHaveBeenCalledWith(mockData, 'receiver');
    });
  });
});
