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

export type ChecklistAnswer = 'yes' | 'no' | 'unanswered';

export interface UserChecklistAnswers {
  transmittedOnTime: ChecklistAnswer;
  purposeForBusiness: ChecklistAnswer;
  preRegistration: ChecklistAnswer;
  specificNonDeductible: ChecklistAnswer;
}

export interface AIAdvisoryResponse {
  summary: string;
  checklists: string[];
  warnings: string[];
  deductionStatus: 'possible' | 'impossible' | 'check_required';
}

export enum AppStep {
  ROLE_SELECTION = 0,
  UPLOAD = 1,
  EXTRACTION = 2,
  VALIDATION = 3,
  ADVISORY = 4,
}
