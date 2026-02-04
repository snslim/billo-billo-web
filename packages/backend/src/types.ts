export type DocType = 'general' | 'zero_rate' | 'duty_free' | 'unknown';

export interface InvoiceData {
  docType: DocType;
  isTaxInvoice: boolean;
  supplierRegNo: string;
  supplierName: string;
  receiverRegNo: string;
  date: string;
  supplyAmount: number;
  taxAmount: number;
}
