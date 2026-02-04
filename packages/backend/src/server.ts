import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseUpstageResponse } from './ocr/upstageParsing.js';

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
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
});

const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'OCR 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
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
    mimetype: req.file.mimetype
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

    const apiKey = process.env.UPSTAGE_API_KEY;
    if (!apiKey) {
      console.error('UPSTAGE API 키가 설정되지 않았습니다');
      res.status(500).json({ error: 'OCR 서비스 설정 오류' });
      return;
    }

    const formData = new FormData();
    formData.append('document', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    const response = await fetch('https://api.upstage.ai/v1/document-ai/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`UPSTAGE API 오류: ${response.status}`);
      console.error('에러 상세:', errorBody);
      res.status(500).json({ error: 'OCR 처리 실패' });
      return;
    }

    const rawData = await response.json();
    const invoiceData = parseUpstageResponse(rawData);
    res.json(invoiceData);

  } catch (error) {
    console.error('OCR 처리 오류:', error);
    res.status(500).json({ error: 'OCR 처리 중 오류가 발생했습니다' });
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

app.listen(PORT);
