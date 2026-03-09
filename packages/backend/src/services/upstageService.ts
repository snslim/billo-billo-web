import FormData from 'form-data';
import fetch from 'node-fetch';
import { parseUpstageResponse } from '../upstageParsing.js';
import type { OcrResult } from '../types.js';
import { logger } from '../utils/logger.js';

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
    logger.error({ status: response.status, body: errorBody }, 'UPSTAGE API 오류');
    throw new Error('OCR 처리 실패');
  }

  const rawData = await response.json();
  return parseUpstageResponse(rawData);
}
