import rateLimit from 'express-rate-limit';

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'OCR 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

export const validateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: '검증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});
