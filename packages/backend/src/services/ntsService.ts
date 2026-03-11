import { logger } from '../utils/logger.js';
import { fetchWithRetry } from '../utils/retry.js';
import type { NtsValidationResponse } from '../types.js';

export async function validateBusiness(businessNumbers: string[]): Promise<NtsValidationResponse> {
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
    logger.error({ status: response.status }, 'NTS API error');
    throw new Error('국세청 조회 실패');
  }

  return (await response.json()) as NtsValidationResponse;
}
