import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseUpstageResponse } from './upstageParsing.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다'));
    }
  },
});

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

const requiredEnvVars = ['FRONTEND_URL', 'UPSTAGE_API_KEY', 'NTS_API_KEY', 'GEMINI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} 환경 변수가 설정되지 않았습니다`);
  }
}

app.use(cors({ origin: process.env.FRONTEND_URL }));
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: '5MB 이하 파일만 업로드 가능합니다' });
      return;
    }
    res.status(400).json({ error: '파일 업로드 오류가 발생했습니다' });
    return;
  }
  if (err.message === '지원하지 않는 파일 형식입니다') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('서버 오류:', err.message);
  res.status(500).json({ error: '서버 오류가 발생했습니다' });
});

const server = app.listen(PORT, () => {
  console.log(`서버 실행 중: 포트 ${PORT}`);
});

export { app, server };
export default app;
