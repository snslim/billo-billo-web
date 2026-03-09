import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { upload } from './middlewares/upload.js';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { parseUpstageResponse } from './upstageParsing.js';

const app = express();

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'OCR 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

const ALLOWED_ORIGINS = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(
  (origin): origin is string => Boolean(origin)
);

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/upload', uploadLimiter, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: '파일이 없습니다' });
    return;
  }
  res.json({
    message: '파일 업로드 성공',
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

app.post('/api/ocr', ocrLimiter, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: '파일이 없습니다' });
      return;
    }

    if (!file.mimetype.startsWith('image/')) {
      res.status(400).json({ error: '이미지 파일만 OCR 처리 가능합니다' });
      return;
    }

    const formData = new FormData();
    formData.append('document', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

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
      res.status(500).json({ error: 'OCR 처리 실패' });
      return;
    }

    const rawData = await response.json();
    const ocrResult = parseUpstageResponse(rawData);
    res.json(ocrResult);
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    res.status(500).json({ error: 'OCR 처리 중 오류가 발생했습니다' });
  }
});

const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '검증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

app.post('/api/validate-business', validateLimiter, async (req: Request, res: Response) => {
  try {
    const { b_no } = req.body;

    if (!b_no || !Array.isArray(b_no) || b_no.length === 0) {
      res.status(400).json({ error: '사업자등록번호가 필요합니다' });
      return;
    }

    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${process.env.NTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b_no }),
      }
    );

    if (!response.ok) {
      console.error(`국세청 API 오류: ${response.status}`);
      res.status(500).json({ error: '국세청 조회 실패' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('사업자 검증 오류:', error);
    res.status(500).json({ error: '사업자 검증 중 오류가 발생했습니다' });
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

app.post('/api/embeddings', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: '텍스트 배열이 필요합니다' });
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((text: string) => ({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          })),
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini Embedding API 오류:', errorBody);
      res.status(500).json({ error: 'Embedding 처리 실패' });
      return;
    }

    const data = (await response.json()) as { embeddings?: Array<{ values: number[] }> };
    const embeddings = data.embeddings?.map((e) => e.values) || [];
    res.json({ embeddings });
  } catch (error) {
    console.error('Embedding 오류:', error);
    res.status(500).json({ error: 'Embedding 처리 중 오류가 발생했습니다' });
  }
});

app.post('/api/advisory', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { contents, systemInstruction } = req.body;

    if (!contents || !systemInstruction) {
      res.status(400).json({ error: '요청 데이터가 필요합니다' });
      return;
    }

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
      res.status(500).json({ error: 'AI 조언 생성 실패' });
      return;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    res.json({ text });
  } catch (error) {
    console.error('AI 조언 오류:', error);
    res.status(500).json({ error: 'AI 조언 생성 중 오류가 발생했습니다' });
  }
});

app.use(errorHandler);

export { app };
export default app;
