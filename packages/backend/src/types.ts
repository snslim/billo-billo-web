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

export interface NtsBusinessStatus {
  b_no: string;
  b_stt: string;
  b_stt_cd: string;
  tax_type: string;
  tax_type_cd: string;
  end_dt: string;
  utcc_yn: string;
  tax_type_change_dt: string;
  invoice_apply_dt: string;
  rbf_tax_type: string;
  rbf_tax_type_cd: string;
}

export interface NtsValidationResponse {
  status_code: string;
  match_cnt: number;
  request_cnt: number;
  data: NtsBusinessStatus[];
}

export interface GeminiEmbeddingResponse {
  embeddings: Array<{ values: number[] }>;
}

export interface GeminiGenerateResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}
