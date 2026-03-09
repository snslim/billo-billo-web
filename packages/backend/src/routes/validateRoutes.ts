import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBusiness } from '../services/ntsService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '검증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

router.post(
  '/validate-business',
  validateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { b_no } = req.body;

    if (!b_no || !Array.isArray(b_no) || b_no.length === 0) {
      throw new AppError(400, '사업자등록번호가 필요합니다');
    }

    const data = await validateBusiness(b_no);
    res.json(data);
  })
);

export { router as validateRoutes };
