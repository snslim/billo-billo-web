import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: '5MB 이하 파일만 업로드 가능합니다' });
      return;
    }
    res.status(400).json({ error: '파일 업로드 오류가 발생했습니다' });
    return;
  }

  if (err instanceof AppError) {
    logger.error({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled server error');
  res.status(500).json({ error: err.message });
}
