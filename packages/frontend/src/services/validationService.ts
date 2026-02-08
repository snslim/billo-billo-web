import type { InvoiceData, UserRole, ValidationReport, ValidationResult } from '../types';
import { parse, isValid, isAfter } from 'date-fns';

interface BusinessStatus {
  b_no: string;
  b_stt: '계속사업자' | '휴업자' | '폐업자' | '';
  b_stt_cd: string;
  tax_type: string;
  end_dt?: string;
  utcc_yn?: 'Y' | 'N';
  invoice_apply_dt?: string;
}

const validateRegNo = (num: string, label: string): ValidationResult => {
  const cleaned = num.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) {
    return { isValid: false, message: `${label} 형식이 올바르지 않습니다`, type: 'error' };
  }

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights[i];
  }
  const lastWeightCalc = parseInt(cleaned.charAt(8)) * 5;
  sum += Math.floor(lastWeightCalc / 10) + (lastWeightCalc / 10 % 1);
  const remainder = sum % 10;
  const checkDigit = (10 - remainder) % 10;

  if (checkDigit !== parseInt(cleaned.charAt(9))) {
    return { isValid: false, message: `${label} 유효하지 않은 번호입니다 (체크섬 오류)`, type: 'error' };
  }

  return { isValid: true, message: '번호 규칙 일치 (국세청 DB 조회 대기...)', type: 'loading' };
};

const validateTaxMath = (supply: number, tax: number): ValidationResult => {
  if (supply < 0 || tax < 0) {
    return { isValid: false, message: '금액 오류: 음수 불가', type: 'error' };
  }
  const expectedTax = Math.floor(supply * 0.1);
  const diff = Math.abs(expectedTax - tax);

  if (diff <= 10) {
    return { isValid: true, message: '세액 계산 일치', type: 'success' };
  }
  return {
    isValid: false,
    message: `세액 불일치 (계산값: ${expectedTax.toLocaleString()}원)`,
    type: 'error'
  };
};

const validateDateAndDeadline = (dateStr: string): ValidationResult => {
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());

  if (!isValid(parsedDate)) {
    return { isValid: false, message: '날짜 형식 오류', type: 'error' };
  }

  const now = new Date();
  if (isAfter(parsedDate, now)) {
    return { isValid: false, message: '작성일이 미래입니다.', type: 'error' };
  }

  return {
    isValid: true,
    message: '작성연월일 식별됨',
    type: 'success'
  };
};

const fetchBusinessStatusBulk = async (regNos: string[]): Promise<Map<string, BusinessStatus>> => {
  const cleanNos = regNos.map(r => r.replace(/-/g, ''));
  const resultMap = new Map<string, BusinessStatus>();

  if (cleanNos.length === 0) return resultMap;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('http://localhost:3000/api/validate-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b_no: cleanNos }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();

    if (json && Array.isArray(json.data)) {
      json.data.forEach((item: BusinessStatus) => {
        if (item && item.b_no) {
          resultMap.set(item.b_no, item);
        }
      });
    }
  } catch (e: unknown) {
    const error = e as Error;
    if (error.name === 'AbortError') {
      console.error('Business Status Check Timed Out');
    } else {
      console.error('Business Status Fetch Failed:', error.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return resultMap;
};

const checkBusinessStatusWithDate = (
  invoiceDate: string,
  status: BusinessStatus | undefined,
  label: string
): ValidationResult => {
  if (!status) {
    return {
      isValid: false,
      message: `${label} 조회 실패`,
      type: 'warning',
      details: '국세청 서버 응답 없음 또는 네트워크 오류'
    };
  }

  const prefix = '[국세청 조회] ';

  if (status.b_stt === '계속사업자') {
    return { isValid: true, message: `${prefix}정상 사업자 (${status.tax_type})`, type: 'success' };
  }

  if (status.b_stt === '휴업자') {
    return { isValid: false, message: `${prefix}휴업 상태`, type: 'error', details: '휴업기간 중 발급 불가' };
  }

  if (status.b_stt === '폐업자') {
    const endDt = status.end_dt;
    if (endDt && endDt.length === 8) {
      const formattedEndDt = `${endDt.slice(0, 4)}-${endDt.slice(4, 6)}-${endDt.slice(6, 8)}`;
      const invDate = parse(invoiceDate, 'yyyy-MM-dd', new Date());
      const closeDate = parse(formattedEndDt, 'yyyy-MM-dd', new Date());

      if (isValid(invDate) && isValid(closeDate) && isAfter(invDate, closeDate)) {
        return {
          isValid: false,
          message: `${prefix}폐업 (폐업일: ${formattedEndDt})`,
          type: 'error',
          details: '폐업일 이후 작성된 세금계산서는 매입세액 공제가 불가능합니다.'
        };
      }
    }
    return {
      isValid: true,
      message: `${prefix}폐업자 (작성일 기준 유효)`,
      type: 'warning',
      details: `현재는 폐업 상태입니다 (폐업일: ${status.end_dt})`
    };
  }

  if (status.tax_type.includes('국세청에 등록되지 않은') || status.tax_type === '미등록') {
    return { isValid: false, message: `${prefix}미등록 번호`, type: 'error', details: '국세청 DB에 존재하지 않는 번호입니다.' };
  }

  return { isValid: false, message: `${prefix}${status.b_stt || '확인불가'}`, type: 'warning' };
};

export const validateInvoiceAsync = async (
  data: InvoiceData,
  _role: UserRole
): Promise<ValidationReport> => {
  let supplierRegNoValid = validateRegNo(data.supplierRegNo, '공급자 번호');
  let receiverRegNoValid = validateRegNo(data.receiverRegNo, '공급받는자 번호');
  const taxCalculation = validateTaxMath(data.supplyAmount, data.taxAmount);
  const dateValidity = validateDateAndDeadline(data.date);


  const regNosToFetch: string[] = [];
  if (supplierRegNoValid.isValid) regNosToFetch.push(data.supplierRegNo);
  if (receiverRegNoValid.isValid) regNosToFetch.push(data.receiverRegNo);

  const statusMap = await fetchBusinessStatusBulk(regNosToFetch);

  let supplierStatus: ValidationResult = { isValid: false, message: '조회 대기', type: 'loading' };
  let receiverStatus: ValidationResult = { isValid: false, message: '조회 대기', type: 'loading' };

  if (supplierRegNoValid.isValid) {
    const cleanSupp = data.supplierRegNo.replace(/-/g, '');
    const status = statusMap.get(cleanSupp);
    supplierStatus = checkBusinessStatusWithDate(data.date, status, '공급자');

    if (status && status.b_stt) {
      supplierRegNoValid = { isValid: true, message: '국세청 DB 등록 번호 확인됨', type: 'success' };
    }
  } else {
    supplierStatus = { isValid: false, message: '형식 오류로 조회 불가', type: 'error' };
  }

  if (receiverRegNoValid.isValid) {
    const cleanRecv = data.receiverRegNo.replace(/-/g, '');
    const status = statusMap.get(cleanRecv);
    receiverStatus = checkBusinessStatusWithDate(data.date, status, '공급받는자');

    if (status && status.b_stt) {
      receiverRegNoValid = { isValid: true, message: '국세청 DB 등록 번호 확인됨', type: 'success' };
    }
  } else {
    receiverStatus = { isValid: false, message: '형식 오류로 조회 불가', type: 'error' };
  }

  return {
    supplierRegNoValid,
    receiverRegNoValid,
    supplierStatus,
    receiverStatus,
    taxCalculation,
    dateValidity
  };
};
