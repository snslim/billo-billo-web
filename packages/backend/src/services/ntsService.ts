import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

export async function validateBusiness(businessNumbers: string[]): Promise<unknown> {
  const response = await fetch(
    `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${process.env.NTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b_no: businessNumbers }),
    }
  );

  if (!response.ok) {
    logger.error({ status: response.status }, '국세청 API 오류');
    throw new Error('국세청 조회 실패');
  }

  return response.json();
}
