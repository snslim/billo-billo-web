import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBusiness } from '../services/ntsService.js';
import { logger } from '../utils/logger.js';

const router = Router();

const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '검증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

router.post('/validate-business', validateLimiter, async (req: Request, res: Response) => {
  try {
    const { b_no } = req.body;

    if (!b_no || !Array.isArray(b_no) || b_no.length === 0) {
      res.status(400).json({ error: '사업자등록번호가 필요합니다' });
      return;
    }

    const data = await validateBusiness(b_no);
    res.json(data);
  } catch (error) {
    logger.error({ err: error }, '사업자 검증 오류');
    const message = error instanceof Error ? error.message : '사업자 검증 중 오류가 발생했습니다';
    res.status(500).json({ error: message });
  }
});

export { router as validateRoutes };
