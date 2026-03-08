import type {
  InvoiceData,
  DocType,
  OcrResult,
  ConfidenceLevel,
  FieldConfidence,
  OcrParseError,
} from './types.js';

interface UpstageResponse {
  text?: string;
  pages?: Array<{
    words?: Array<{
      text: string;
      boundingBox: { vertices: Array<{ x: number; y: number }> };
    }>;
  }>;
}

function isUpstageResponse(value: unknown): value is UpstageResponse {
  return typeof value === 'object' && value !== null && ('text' in value || 'pages' in value);
}

const FORM_LABELS = new Set([
  '성명',
  '법인명',
  '대표자',
  '사업장',
  '주소',
  '공급자',
  '공급받는자',
  '등록번호',
  '사업자등록번호',
  '업태',
  '종목',
  '작성일자',
  '세금계산서',
  '전자세금계산서',
  '공급가액',
  '합계금액',
]);

const BUSINESS_KEYWORDS = [
  '기업',
  '상사',
  '산업',
  '무역',
  '물산',
  '전자',
  '건설',
  '건축',
  '부동산',
  '자동차',
  '부품',
  '문구',
  '식품',
  '유통',
  '물류',
  '제약',
  '화학',
  '철강',
  '섬유',
  '인쇄',
  '출판',
  '통신',
  '에너지',
  '엔지니어링',
  '테크',
  '소프트',
  '컨설팅',
  '법인',
  '약국',
  '병원',
  '의원',
  '학원',
];

const DATE_PATTERNS = [
  /(\d{4})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})/,
  /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/,
  /(\d{4})\s+(\d{1,2})\s+[I1]/,
  /20[○0-9]{2}\s+(\d{1,2})\s+(\d{1,2})/,
];

const extractNameFromLabel = (text: string): string[] => {
  const names: string[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!/상\s*호/.test(line)) continue;

    const afterLabel = line.replace(/.*상\s*호\s*(?:\(법인명\))?\s*[:：]?\s*/, '').trim();
    const cleaned = afterLabel.replace(/\s*(성명|대표자|사업장|주소).*$/, '').trim();

    if (cleaned.length >= 2 && !FORM_LABELS.has(cleaned)) {
      names.push(cleaned.replace(/\s+/g, ''));
      continue;
    }

    const nextLine = lines[i + 1]?.trim() || '';
    if (nextLine.length >= 2 && !FORM_LABELS.has(nextLine)) {
      names.push(nextLine.replace(/\s+/g, ''));
    }
  }
  return names;
};

export const parseUpstageResponse = (response: unknown): OcrResult => {
  const parseErrors: OcrParseError[] = [];
  const confidence: FieldConfidence = {
    docType: 'missing',
    isTaxInvoice: 'high',
    supplierRegNo: 'missing',
    supplierName: 'missing',
    receiverRegNo: 'missing',
    receiverName: 'missing',
    date: 'missing',
    supplyAmount: 'missing',
    taxAmount: 'missing',
  };
  if (!isUpstageResponse(response)) {
    throw new Error('유효하지 않은 Upstage OCR 응답 형식입니다');
  }
  const fullText = response.text || '';

  const normalizedText = fullText.replace(/\s+/g, '');
  let docType: DocType = 'unknown';
  if (normalizedText.includes('영세율')) {
    docType = 'zero_rate';
  } else if (normalizedText.includes('세금계산서')) {
    docType = 'general';
  } else if (normalizedText.includes('계산서') || normalizedText.includes('면세')) {
    docType = 'duty_free';
  }
  confidence.docType = docType === 'unknown' ? 'low' : 'high';

  let supplierRegNo = '';
  let receiverRegNo = '';

  const regNoPattern1 = /\d{3}-\d{2}-\d{5}/g;
  const matches1 = fullText.match(regNoPattern1) || [];

  const regNoPattern2 = /등록번호\s*([\d\s-]+)/g;
  const matches2 = [...fullText.matchAll(regNoPattern2)];

  if (matches1.length >= 2) {
    supplierRegNo = matches1[0] || '';
    receiverRegNo = matches1[1] || '';
    confidence.supplierRegNo = 'high';
    confidence.receiverRegNo = 'high';
  } else if (matches2.length >= 1) {
    for (let i = 0; i < Math.min(matches2.length, 2); i++) {
      const raw = matches2[i]?.[1] || '';
      const digits = raw.replace(/[\s-]/g, '');
      if (digits.length >= 10) {
        const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
        if (i === 0) {
          supplierRegNo = formatted;
          confidence.supplierRegNo = 'medium';
        } else {
          receiverRegNo = formatted;
          confidence.receiverRegNo = 'medium';
        }
      }
    }
  }

  let supplierName = '';
  let receiverName = '';

  const labelNames = extractNameFromLabel(fullText);
  if (labelNames[0]) {
    supplierName = labelNames[0];
    confidence.supplierName = 'high';
  }
  if (labelNames[1]) {
    receiverName = labelNames[1];
    confidence.receiverName = 'high';
  }

  if (!supplierName) {
    const companyPattern = /(?:\(주\)|㈜|주식회사)\s*[가-힣A-Za-z0-9]+/g;
    const companyMatches = fullText.match(companyPattern) || [];
    const firstCompany = companyMatches[0];
    const secondCompany = companyMatches[1];
    if (firstCompany) {
      supplierName = firstCompany.replace(/\s+/g, '');
      confidence.supplierName = 'medium';
    }
    if (secondCompany && !receiverName) {
      receiverName = secondCompany.replace(/\s+/g, '');
      confidence.receiverName = 'medium';
    }
  }

  if (!supplierName) {
    const lines = fullText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const koreanWords = line.match(/[가-힣]{3,}/g) || [];
      for (const word of koreanWords) {
        if (BUSINESS_KEYWORDS.some((k) => word.includes(k)) && !FORM_LABELS.has(word)) {
          if (!supplierName) {
            supplierName = word;
            confidence.supplierName = 'low';
          } else if (!receiverName && word !== supplierName) {
            receiverName = word;
            confidence.receiverName = 'low';
          }
        }
      }
    }
  }

  if (!supplierName) {
    const namePattern = /([가-힣]{2,})\s*성명/g;
    const nameMatches = [...fullText.matchAll(namePattern)];
    for (const match of nameMatches) {
      const name = match[1];
      if (name && !FORM_LABELS.has(name) && name.length >= 2) {
        if (!supplierName) {
          supplierName = name;
          confidence.supplierName = 'low';
        } else if (!receiverName && name !== supplierName) {
          receiverName = name;
          confidence.receiverName = 'low';
        }
      }
    }
  }

  let date = '';

  for (const pattern of DATE_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      if (pattern.source.includes('○')) {
        const year = '2000';
        const month = match[1]?.padStart(2, '0') || '01';
        const day = match[2]?.padStart(2, '0') || '01';
        date = `${year}-${month}-${day}`;
      } else {
        const year = match[1];
        const month = match[2]?.padStart(2, '0') || '01';
        let day = match[3] || '01';
        if (day === 'I') day = '1';
        date = `${year}-${month}-${day.padStart(2, '0')}`;
      }
      confidence.date = DATE_PATTERNS.indexOf(pattern) === 0 ? 'high' : 'medium';
      break;
    }
  }

  let supplyAmount = 0;
  let taxAmount = 0;

  const amountPattern = /\d{1,3}(?:,\d{3})+/g;
  const amountMatches = fullText.match(amountPattern) || [];
  const amounts = amountMatches
    .map((s) => parseInt(s.replace(/,/g, ''), 10))
    .filter((n) => n >= 1000)
    .sort((a, b) => b - a);

  const uniqueAmounts = [...new Set(amounts)];

  let amountConfidence: ConfidenceLevel = 'missing';

  if (uniqueAmounts.length >= 3) {
    const total = uniqueAmounts[0] || 0;
    const supply = uniqueAmounts[1] || 0;
    const tax = uniqueAmounts[2] || 0;

    if (Math.abs(total - (supply + tax)) < 100) {
      supplyAmount = supply;
      taxAmount = tax;
      amountConfidence = 'high';
    } else {
      supplyAmount = Math.round(total / 1.1);
      taxAmount = total - supplyAmount;
      amountConfidence = 'medium';
    }
  } else if (uniqueAmounts.length >= 2) {
    const first = uniqueAmounts[0] || 0;
    const second = uniqueAmounts[1] || 0;

    if (Math.abs(second - first * 0.1) < first * 0.02) {
      supplyAmount = first;
      taxAmount = second;
      amountConfidence = 'high';
    } else if (Math.abs(first - second * 1.1) < second * 0.02) {
      supplyAmount = second;
      taxAmount = first - second;
      amountConfidence = 'medium';
    } else {
      supplyAmount = Math.round(first / 1.1);
      taxAmount = first - supplyAmount;
      amountConfidence = 'low';
    }
  } else if (uniqueAmounts.length === 1) {
    const total = uniqueAmounts[0] || 0;
    supplyAmount = Math.round(total / 1.1);
    taxAmount = total - supplyAmount;
    amountConfidence = 'low';
  }
  confidence.supplyAmount = amountConfidence;
  confidence.taxAmount = amountConfidence;

  if (!supplierRegNo)
    parseErrors.push({
      field: 'supplierRegNo',
      reason: '공급자 사업자등록번호를 추출하지 못했습니다',
    });
  if (!supplierName)
    parseErrors.push({ field: 'supplierName', reason: '공급자 상호를 추출하지 못했습니다' });
  if (!date) parseErrors.push({ field: 'date', reason: '작성일자를 추출하지 못했습니다' });
  if (supplyAmount === 0)
    parseErrors.push({ field: 'supplyAmount', reason: '공급가액을 추출하지 못했습니다' });

  const data: InvoiceData = {
    docType,
    isTaxInvoice: docType === 'general',
    supplierRegNo,
    supplierName,
    receiverRegNo,
    receiverName,
    date,
    supplyAmount,
    taxAmount,
  };

  return { data, confidence, parseErrors };
};
