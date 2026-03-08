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

// 매입자(공급받는자) 체크리스트 — 매입세액 공제 판단용
export interface ReceiverChecklistAnswers {
  purposeForBusiness: ChecklistAnswer; // 사업 관련 지출인가?
  specificNonDeductible: ChecklistAnswer; // 접대비 등 불공제 항목인가?
  preRegistration: ChecklistAnswer; // 사업자등록 전 매입인가?
}

// 공급자 체크리스트 — 발급 의무 이행 + 가산세 위험 판단용
export interface SupplierChecklistAnswers {
  requiredFieldsCorrect: ChecklistAnswer; // 필요적 기재사항이 정확한가?
  issuedOnTime: ChecklistAnswer; // 공급시기에 맞게 발급했는가?
  isZeroRate: ChecklistAnswer; // 영세율 적용 대상인가?
  needsCorrection: ChecklistAnswer; // 수정세금계산서 발급이 필요한가?
  transmittedOnTime: ChecklistAnswer; // 전자발급 후 기한 내 전송했는가?
  summaryTableReady: ChecklistAnswer; // 매출처별 합계표 준비되었는가?
}

// 역할에 따라 다른 체크리스트 사용
export type UserChecklistAnswers = ReceiverChecklistAnswers | SupplierChecklistAnswers;

// 타입 가드: 공급자 체크리스트인지 판별
export function isSupplierAnswers(
  answers: UserChecklistAnswers
): answers is SupplierChecklistAnswers {
  return 'requiredFieldsCorrect' in answers;
}

// 양쪽 체크리스트의 키를 합친 타입 (UI에서 토글 함수에 사용)
export type ChecklistKey = keyof ReceiverChecklistAnswers | keyof SupplierChecklistAnswers;

// 역할에 따른 기본 체크리스트 응답 생성
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
