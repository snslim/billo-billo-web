import { logger } from '../utils/logger.js';
import { fetchWithRetry } from '../utils/retry.js';

export async function validateBusiness(businessNumbers: string[]): Promise<unknown> {
  const response = await fetchWithRetry(
    `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${process.env.NTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b_no: businessNumbers }),
    },
    { maxAttempts: 3 }
  );

  if (!response.ok) {
    logger.error({ status: response.status }, '국세청 API 오류');
    throw new Error('국세청 조회 실패');
  }

  return response.json();
}
