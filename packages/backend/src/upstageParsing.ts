import type { InvoiceData, DocType } from './types.js';

interface UpstageResponse {
  text?: string;
  pages?: Array<{
    words?: Array<{
      text: string;
      boundingBox: { vertices: Array<{ x: number; y: number }> };
    }>;
  }>;
}

export const parseUpstageResponse = (response: unknown): InvoiceData => {
  const data = response as UpstageResponse;
  const fullText = data.text || '';

  const normalizedText = fullText.replace(/\s+/g, '');
  let docType: DocType = 'unknown';
  if (normalizedText.includes('영세율')) {
    docType = 'zero_rate';
  } else if (normalizedText.includes('세금계산서') || normalizedText.includes('전자세금계산서')) {
    docType = 'general';
  } else if (
    normalizedText.includes('계산서') || 
    normalizedText.includes('면세')
  ) {
    docType = 'duty_free';
  }

  let supplierRegNo = '';
  let receiverRegNo = '';

  const regNoPattern1 = /\d{3}-\d{2}-\d{5}/g;
  const matches1 = fullText.match(regNoPattern1) || [];

  const regNoPattern2 = /등록번호\s*([\d\s-]+)/g;
  const matches2 = [...fullText.matchAll(regNoPattern2)];

  if (matches1.length >= 2) {
    supplierRegNo = matches1[0] || '';
    receiverRegNo = matches1[1] || '';
  } else if (matches2.length >= 1) {
    for (let i = 0; i < Math.min(matches2.length, 2); i++) {
      const raw = matches2[i]?.[1] || '';
      const digits = raw.replace(/[\s-]/g, '');
      if (digits.length >= 10) {
        const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
        if (i === 0) supplierRegNo = formatted;
        else receiverRegNo = formatted;
      }
    }
  }

  let supplierName = '';
  let receiverName = '';

  const excludeWords = ['상', '호', '공', '급', '자', '받', '는', '성명', '법인명', '대표자', '사업장', '주소'];

  const companyPattern = /(?:\(주\)|㈜|주식회사)\s*[가-힣A-Za-z0-9]+/g;
  const companyMatches = fullText.match(companyPattern) || [];
  const firstCompany = companyMatches[0];
  const secondCompany = companyMatches[1];
  if (firstCompany) {
    supplierName = firstCompany.replace(/\s+/g, '');
  }
  if (secondCompany) {
    receiverName = secondCompany.replace(/\s+/g, '');
  }

  if (!supplierName) {
    const lines = fullText.split('\n');
    const businessKeywords = ['자동차', '부품', '기업', '상사', '전자', '물산', '무역', '산업', '문구', '부동산', '빌런즈', '세무', '폼', '쟁이'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const koreanWords = line.match(/[가-힣]{3,}/g) || [];
      for (const word of koreanWords) {
        if (businessKeywords.some(k => word.includes(k)) && !excludeWords.includes(word)) {
          if (!supplierName) {
            supplierName = word;
          } else if (!receiverName && word !== supplierName) {
            receiverName = word;
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
      if (name && !excludeWords.includes(name) && name.length >= 2) {
        if (!supplierName) {
          supplierName = name;
        } else if (!receiverName && name !== supplierName) {
          receiverName = name;
        }
      }
    }
  }

  let date = '';

  const datePatterns = [
    /(\d{4})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})/,
    /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/,
    /(\d{4})\s+(\d{1,2})\s+[I1]/,
    /20[○0-9]{2}\s+(\d{1,2})\s+(\d{1,2})/
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
      break;
    }
  }

  let supplyAmount = 0;
  let taxAmount = 0;

  const amountPattern = /\d{1,3}(?:,\d{3})+/g;
  const amountMatches = fullText.match(amountPattern) || [];
  const amounts = amountMatches
    .map(s => parseInt(s.replace(/,/g, ''), 10))
    .filter(n => n >= 1000)
    .sort((a, b) => b - a);

  const uniqueAmounts = [...new Set(amounts)];

  if (uniqueAmounts.length >= 3) {
    const total = uniqueAmounts[0] || 0;
    const supply = uniqueAmounts[1] || 0;
    const tax = uniqueAmounts[2] || 0;

    if (Math.abs(total - (supply + tax)) < 100) {
      supplyAmount = supply;
      taxAmount = tax;
    } else {
      supplyAmount = Math.round(total / 1.1);
      taxAmount = total - supplyAmount;
    }
  } else if (uniqueAmounts.length >= 2) {
    const first = uniqueAmounts[0] || 0;
    const second = uniqueAmounts[1] || 0;

    if (Math.abs(second - first * 0.1) < first * 0.02) {
      supplyAmount = first;
      taxAmount = second;
    } else if (Math.abs(first - second * 1.1) < second * 0.02) {
      supplyAmount = second;
      taxAmount = first - second;
    } else {
      supplyAmount = Math.round(first / 1.1);
      taxAmount = first - supplyAmount;
    }
  } else if (uniqueAmounts.length === 1) {
    const total = uniqueAmounts[0] || 0;
    supplyAmount = Math.round(total / 1.1);
    taxAmount = total - supplyAmount;
  }

  return {
    docType,
    isTaxInvoice: docType === 'general',
    supplierRegNo,
    supplierName,
    receiverRegNo,
    receiverName,
    date,
    supplyAmount,
    taxAmount
  };
};
