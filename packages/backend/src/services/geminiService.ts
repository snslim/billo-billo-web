import fetch from 'node-fetch';

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(
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
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini Embedding API 오류:', errorBody);
    throw new Error('Embedding 처리 실패');
  }

  const data = (await response.json()) as { embeddings?: Array<{ values: number[] }> };
  return data.embeddings?.map((e) => e.values) || [];
}

export async function generateAdvisory(
  contents: string,
  systemInstruction: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API 오류:', errorBody);
    throw new Error('AI 조언 생성 실패');
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}
