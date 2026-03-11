import type { InvoiceData, UserRole, UserChecklistAnswers } from '../types';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  taxIssue: string;
  lawReference: string;
  role: UserRole;
  invoiceData: InvoiceData;
  suggestedAnswers: Partial<UserChecklistAnswers>;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'normal',
    name: '정상 세금계산서',
    description: '모든 기재사항이 정확하고 매입세액 공제가 가능한 경우',
    taxIssue: '정상 공제',
    lawReference: '부가가치세법 §38',
    role: 'receiver',
    invoiceData: {
      docType: 'general',
      isTaxInvoice: true,
      supplierRegNo: '214-87-45679',
      supplierName: '(주)테스트상사',
      receiverRegNo: '107-86-23458',
      receiverName: '데모주식회사',
      date: '2026-02-15',
      supplyAmount: 1000000,
      taxAmount: 100000,
    },
    suggestedAnswers: {
      purposeForBusiness: 'yes',
      specificNonDeductible: 'no',
      preRegistration: 'no',
    },
  },
  {
    id: 'entertainment',
    name: '접대비 관련 매입',
    description: '거래처 접대 식사비 — 매입세액 불공제 대상',
    taxIssue: '매입세액 불공제',
    lawReference: '부가가치세법 §39①4호',
    role: 'receiver',
    invoiceData: {
      docType: 'general',
      isTaxInvoice: true,
      supplierRegNo: '214-87-45679',
      supplierName: '강남레스토랑',
      receiverRegNo: '107-86-23458',
      receiverName: '데모주식회사',
      date: '2026-02-20',
      supplyAmount: 500000,
      taxAmount: 50000,
    },
    suggestedAnswers: {
      purposeForBusiness: 'yes',
      specificNonDeductible: 'yes',
      preRegistration: 'no',
    },
  },
  {
    id: 'late_issuance',
    name: '지연 발급 (공급자)',
    description: '공급시기 이후 발급하여 가산세 1% 대상',
    taxIssue: '지연발급 가산세',
    lawReference: '부가가치세법 §60②',
    role: 'supplier',
    invoiceData: {
      docType: 'general',
      isTaxInvoice: true,
      supplierRegNo: '214-87-45679',
      supplierName: '(주)테스트상사',
      receiverRegNo: '107-86-23458',
      receiverName: '데모주식회사',
      date: '2026-02-15',
      supplyAmount: 2000000,
      taxAmount: 200000,
    },
    suggestedAnswers: {
      transmittedOnTime: 'no',
    },
  },
  {
    id: 'pre_registration',
    name: '사업자등록 전 매입',
    description: '등록 전 매입이지만 예외 규정으로 공제 가능한 경우',
    taxIssue: '예외 공제',
    lawReference: '시행령 §75',
    role: 'receiver',
    invoiceData: {
      docType: 'general',
      isTaxInvoice: true,
      supplierRegNo: '301-81-12349',
      supplierName: '인테리어공사',
      receiverRegNo: '505-12-45674',
      receiverName: '신규사업자',
      date: '2026-01-10',
      supplyAmount: 3000000,
      taxAmount: 300000,
    },
    suggestedAnswers: {
      purposeForBusiness: 'yes',
      specificNonDeductible: 'no',
      preRegistration: 'yes',
    },
  },
];
