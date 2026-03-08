export type UserRole = 'supplier' | 'receiver' | null;

export type DocType = 'general' | 'zero_rate' | 'duty_free' | 'unknown';

export interface InvoiceData {
  docType: DocType;
  isTaxInvoice: boolean;
  supplierRegNo: string;
  supplierName: string;
  receiverRegNo: string;
  receiverName?: string;
  date: string;
  supplyAmount: number;
  taxAmount: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'missing';

export type FieldConfidence = Record<keyof InvoiceData, ConfidenceLevel>;

export interface OcrParseError {
  field: string;
  reason: string;
  rawText?: string;
}

export interface OcrResult {
  data: InvoiceData;
  confidence: FieldConfidence;
  parseErrors: OcrParseError[];
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

export interface ReceiverChecklistAnswers {
  purposeForBusiness: ChecklistAnswer;
  specificNonDeductible: ChecklistAnswer;
  preRegistration: ChecklistAnswer;
}

export interface SupplierChecklistAnswers {
  requiredFieldsCorrect: ChecklistAnswer;
  issuedOnTime: ChecklistAnswer;
  isZeroRate: ChecklistAnswer;
  needsCorrection: ChecklistAnswer;
  transmittedOnTime: ChecklistAnswer;
  summaryTableReady: ChecklistAnswer;
}

export type UserChecklistAnswers = ReceiverChecklistAnswers | SupplierChecklistAnswers;

export function isSupplierAnswers(
  answers: UserChecklistAnswers
): answers is SupplierChecklistAnswers {
  return 'requiredFieldsCorrect' in answers;
}

export type ChecklistKey = keyof ReceiverChecklistAnswers | keyof SupplierChecklistAnswers;

export function createDefaultAnswers(role: UserRole): UserChecklistAnswers {
  if (role === 'supplier') {
    return {
      requiredFieldsCorrect: 'unanswered',
      issuedOnTime: 'unanswered',
      isZeroRate: 'unanswered',
      needsCorrection: 'unanswered',
      transmittedOnTime: 'unanswered',
      summaryTableReady: 'unanswered',
    };
  }
  return {
    purposeForBusiness: 'unanswered',
    specificNonDeductible: 'unanswered',
    preRegistration: 'unanswered',
  };
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
