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
