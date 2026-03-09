import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { upload } from './middlewares/upload.js';
import { callOcr } from './services/upstageService.js';
import { validateBusiness } from './services/ntsService.js';
import { getEmbeddings, generateAdvisory } from './services/geminiService.js';

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

    const ocrResult = await callOcr(file.buffer, file.originalname, file.mimetype);
    res.json(ocrResult);
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    const message = error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
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

    const data = await validateBusiness(b_no);
    res.json(data);
  } catch (error) {
    console.error('사업자 검증 오류:', error);
    const message = error instanceof Error ? error.message : '사업자 검증 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
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

    const embeddings = await getEmbeddings(texts);
    res.json({ embeddings });
  } catch (error) {
    console.error('Embedding 오류:', error);
    const message =
      error instanceof Error ? error.message : 'Embedding 처리 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
  }
});

app.post('/api/advisory', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { contents, systemInstruction } = req.body;

    if (!contents || !systemInstruction) {
      res.status(400).json({ error: '요청 데이터가 필요합니다' });
      return;
    }

    const text = await generateAdvisory(contents, systemInstruction);
    res.json({ text });
  } catch (error) {
    console.error('AI 조언 오류:', error);
    const message = error instanceof Error ? error.message : 'AI 조언 생성 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
  }
});

app.use(errorHandler);

export { app };
export default app;
