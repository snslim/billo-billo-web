import { logger } from '../utils/logger.js';
import { fetchWithRetry } from '../utils/retry.js';
import type { GeminiEmbeddingResponse, GeminiGenerateResponse } from '../types.js';

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        })),
      }),
    },
    { maxAttempts: 1, timeoutMs: 30_000 }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ body: errorBody }, 'Gemini Embedding API error');
    throw new Error('Embedding 처리 실패');
  }

  const data = (await response.json()) as GeminiEmbeddingResponse;
  return data.embeddings?.map((e) => e.values) || [];
}

export async function generateAdvisory(
  contents: string,
  systemInstruction: string
): Promise<string> {
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: contents }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
    { maxAttempts: 1, timeoutMs: 30_000 }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ body: errorBody }, 'Gemini API error');
    throw new Error('AI 조언 생성 실패');
  }

  const data = (await response.json()) as GeminiGenerateResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}
