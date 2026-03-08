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

// OCR 추출 신뢰도 — 추출 방법에 따라 결정됨
// high: 정규식 정확 매칭 (예: 123-45-67890)
// medium: 패턴 추론 (예: 레이블 기반 상호명 추출)
// low: 불확실한 추론 (예: 키워드 기반 상호명 추출)
// missing: 미추출
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'missing';

// 각 필드의 추출 결과를 값 + 신뢰도 + 방법으로 감싸는 제네릭 타입
export interface ParsedField<T> {
  value: T;
  confidence: ConfidenceLevel;
  method: string; // 어떤 방식으로 추출했는지 (예: 'regex-standard', 'label-based')
}

// InvoiceData의 주요 필드에 대한 신뢰도 맵
export type FieldConfidence = Record<keyof InvoiceData, ConfidenceLevel>;

// OCR 파싱 중 발생한 필드 단위 에러
export interface OcrParseError {
  field: string;
  reason: string;
  rawText?: string;
}

// parseUpstageResponse의 반환 타입
export interface OcrResult {
  data: InvoiceData;
  confidence: FieldConfidence;
  parseErrors: OcrParseError[];
}
