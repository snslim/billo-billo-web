import { Router, Request, Response } from 'express';
import { upload } from '../middlewares/upload.js';
import { uploadLimiter, ocrLimiter } from '../middlewares/rateLimiter.js';
import { callOcr } from '../services/upstageService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

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

router.post(
  '/ocr',
  ocrLimiter,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new AppError(400, '파일이 없습니다');
    if (!file.mimetype.startsWith('image/'))
      throw new AppError(400, '이미지 파일만 OCR 처리 가능합니다');

    const ocrResult = await callOcr(file.buffer, file.originalname, file.mimetype);
    res.json(ocrResult);
  })
);

export { router as ocrRoutes };
