export type UserRole = 'supplier' | 'receiver' | null;

export type DocType = 'general' | 'zero_rate' | 'duty_free' | 'unknown';

export interface InvoiceData {
  docType: DocType;
  isTaxInvoice: boolean;
  supplierRegNo: string;
  supplierName: string;
  receiverRegNo: string;
  receiverName: string;
  date: string;
  supplyAmount: number;
  taxAmount: number;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'loading';
  details?: string;
}

export interface ValidationReport {
  supplierRegNoValid: ValidationResult;
  receiverRegNoValid: ValidationResult;
  supplierStatus: ValidationResult;
  receiverStatus: ValidationResult;
  taxCalculation: ValidationResult;
  dateValidity: ValidationResult;
}

export interface UserChecklistAnswers {
  isElectronic?: boolean;
  transmittedOnTime?: boolean;
  purposeForBusiness?: boolean;
  preRegistration?: boolean;
  specificNonDeductible?: boolean;
}

export interface AIAdvisoryResponse {
  summary: string;
  checklists: string[];
  warnings: string[];
  deductionStatus: 'possible' | 'impossible' | 'check_required';
}

export const AppStep = {
  ROLE_SELECTION: 0,
  UPLOAD: 1,
  EXTRACTION: 2,
  VALIDATION: 3,
  ADVISORY: 4
} as const;

export type AppStep = (typeof AppStep)[keyof typeof AppStep];
