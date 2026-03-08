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
  } else if (normalizedText.includes('세금계산서') || normalizedText.includes('전자세금계산서')) {
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

  const excludeWords = [
    '상',
    '호',
    '공',
    '급',
    '자',
    '받',
    '는',
    '성명',
    '법인명',
    '대표자',
    '사업장',
    '주소',
  ];

  // 1순위: 양식 레이블 기반 추출 (세금계산서 표준 양식에서 "상호" 레이블 뒤의 값)
  // 줄 단위로 처리하여 다른 섹션의 값이 섞이지 않도록 함
  const labelExclude = new Set([
    ...excludeWords,
    '공급자',
    '공급받는자',
    '등록번호',
    '사업자등록번호',
    '업태',
    '종목',
    '작성일자',
    '세금계산서',
    '전자세금계산서',
  ]);

  const extractNameFromLabel = (text: string): string[] => {
    const names: string[] = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!/상\s*호/.test(line)) continue;

      // 같은 줄에서 "상호" 레이블 뒤의 값 추출
      const afterLabel = line.replace(/.*상\s*호\s*[(법인명)]*\s*[:：]?\s*/, '').trim();
      // "성명", "대표자" 등 후행 레이블 제거
      const cleaned = afterLabel.replace(/\s*(성명|대표자|사업장|주소).*$/, '').trim();

      if (cleaned.length >= 2 && !labelExclude.has(cleaned)) {
        names.push(cleaned.replace(/\s+/g, ''));
        continue;
      }

      // 같은 줄에 값이 없으면 다음 줄에서 시도
      const nextLine = lines[i + 1]?.trim() || '';
      if (nextLine.length >= 2 && !labelExclude.has(nextLine)) {
        names.push(nextLine.replace(/\s+/g, ''));
      }
    }
    return names;
  };

  const labelNames = extractNameFromLabel(fullText);
  if (labelNames[0]) {
    supplierName = labelNames[0];
    confidence.supplierName = 'high';
  }
  if (labelNames[1]) {
    receiverName = labelNames[1];
    confidence.receiverName = 'high';
  }

  // 2순위: (주)/㈜/주식회사 접두사 패턴
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

  // 3순위: 사업 키워드 기반 (fallback)
  if (!supplierName) {
    const lines = fullText.split('\n');
    const businessKeywords = [
      '자동차',
      '부품',
      '기업',
      '상사',
      '전자',
      '물산',
      '무역',
      '산업',
      '문구',
      '부동산',
      '빌런즈',
      '세무',
      '폼',
      '쟁이',
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const koreanWords = line.match(/[가-힣]{3,}/g) || [];
      for (const word of koreanWords) {
        if (businessKeywords.some((k) => word.includes(k)) && !excludeWords.includes(word)) {
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

  // 4순위: "홍길동 성명" 패턴 (개인사업자)
  if (!supplierName) {
    const namePattern = /([가-힣]{2,})\s*성명/g;
    const nameMatches = [...fullText.matchAll(namePattern)];
    for (const match of nameMatches) {
      const name = match[1];
      if (name && !excludeWords.includes(name) && name.length >= 2) {
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

  const datePatterns = [
    /(\d{4})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})/,
    /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/,
    /(\d{4})\s+(\d{1,2})\s+[I1]/,
    /20[○0-9]{2}\s+(\d{1,2})\s+(\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
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
      // 첫 번째 패턴(년월일)은 high, 나머지는 medium
      confidence.date = datePatterns.indexOf(pattern) === 0 ? 'high' : 'medium';
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

  // 필수 필드 미추출 시 에러 기록
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
