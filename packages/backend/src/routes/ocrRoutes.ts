import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../middlewares/upload.js';
import { callOcr } from '../services/upstageService.js';
import { logger } from '../utils/logger.js';

const router = Router();

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

router.post('/upload', uploadLimiter, upload.single('file'), (req: Request, res: Response) => {
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

router.post('/ocr', ocrLimiter, upload.single('file'), async (req: Request, res: Response) => {
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
    logger.error({ err: error }, 'OCR 처리 오류');
    const message = error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
  }
});

export { router as ocrRoutes };
