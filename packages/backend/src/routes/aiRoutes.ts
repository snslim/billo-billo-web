import { Router, Request, Response } from 'express';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { getEmbeddings, generateAdvisory } from '../services/geminiService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/embeddings',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new AppError(400, '텍스트 배열이 필요합니다');
    }

    const embeddings = await getEmbeddings(texts);
    res.json({ embeddings });
  })
);

router.post(
  '/advisory',
  aiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { contents, systemInstruction } = req.body;

    if (!contents || !systemInstruction) {
      throw new AppError(400, '요청 데이터가 필요합니다');
    }

    const text = await generateAdvisory(contents, systemInstruction);
    res.json({ text });
  })
);

export { router as aiRoutes };
