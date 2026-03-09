import FormData from 'form-data';
import fetch from 'node-fetch';
import { parseUpstageResponse } from '../upstageParsing.js';
import type { OcrResult } from '../types.js';

export async function callOcr(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<OcrResult> {
  const formData = new FormData();
  formData.append('document', fileBuffer, { filename, contentType: mimetype });

  const response = await fetch('https://api.upstage.ai/v1/document-ai/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTAGE_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`UPSTAGE API 오류: ${response.status}`);
    console.error('에러 상세:', errorBody);
    throw new Error('OCR 처리 실패');
  }

  const rawData = await response.json();
  return parseUpstageResponse(rawData);
}
