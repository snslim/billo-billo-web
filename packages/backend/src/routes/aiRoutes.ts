import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getEmbeddings, generateAdvisory } from '../services/geminiService.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

router.post('/embeddings', aiLimiter, async (req: Request, res: Response) => {
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

router.post('/advisory', aiLimiter, async (req: Request, res: Response) => {
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

export { router as aiRoutes };
