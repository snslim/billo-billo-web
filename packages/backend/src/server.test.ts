import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';

process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.UPSTAGE_API_KEY = 'test-upstage-key';
process.env.NTS_API_KEY = 'test-nts-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.PORT = '3099';

const mockFetch = vi.fn();
vi.mock('node-fetch', () => ({
  default: mockFetch
}));

describe('Server API', () => {
  let app: any;
  let server: Server;

  beforeAll(async () => {
    const serverModule = await import('./server.js');
    app = serverModule.app;
    server = serverModule.server;
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/health', () => {
    it('상태 코드 200과 헬스 체크 상태를 반환한다', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('유효한 ISO 타임스탬프를 반환한다', async () => {
      const response = await request(app).get('/api/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('POST /api/upload', () => {
    it('파일이 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('파일이 없습니다');
    });

    it('JPEG 이미지를 업로드한다', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('fake image'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('파일 업로드 성공');
      expect(response.body.filename).toBe('test.jpg');
    });

    it('PNG 이미지를 업로드한다', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('fake image'), { filename: 'test.png', contentType: 'image/png' });

      expect(response.status).toBe(200);
      expect(response.body.mimetype).toBe('image/png');
    });

    it('PDF 파일을 업로드한다', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('fake pdf'), { filename: 'test.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(200);
    });

    it('지원하지 않는 파일 형식을 거부한다', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('fake data'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('지원하지 않는 파일 형식');
    });
  });

  describe('POST /api/ocr', () => {
    it('파일이 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/ocr')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('파일이 없습니다');
    });

    it('이미지가 아닌 파일은 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/ocr')
        .attach('file', Buffer.from('fake pdf'), { filename: 'test.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('이미지 파일만 OCR 처리 가능합니다');
    });

    it('유효한 이미지로 OCR을 실행하고 응답을 파싱한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '전자세금계산서\n123-45-67890' })
      });

      const response = await request(app)
        .post('/api/ocr')
        .attach('file', Buffer.from('fake image'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('docType');
      expect(response.body).toHaveProperty('supplierRegNo');
    });

    it('Upstage API 오류를 처리한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'API Error'
      });

      const response = await request(app)
        .post('/api/ocr')
        .attach('file', Buffer.from('fake image'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('OCR 처리 실패');
    });
  });

  describe('POST /api/validate-business', () => {
    it('b_no가 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/validate-business')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('사업자등록번호가 필요합니다');
    });

    it('빈 b_no 배열은 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/validate-business')
        .send({ b_no: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('사업자등록번호가 필요합니다');
    });

    it('잘못된 b_no 형식은 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/validate-business')
        .send({ b_no: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('사업자등록번호가 필요합니다');
    });

    it('유효한 b_no로 국세청 API를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ status: '01' }] })
      });

      const response = await request(app)
        .post('/api/validate-business')
        .send({ b_no: ['1234567890'] });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('국세청 API 오류를 처리한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await request(app)
        .post('/api/validate-business')
        .send({ b_no: ['1234567890'] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('국세청 조회 실패');
    });
  });

  describe('POST /api/embeddings', () => {
    it('texts가 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/embeddings')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('텍스트 배열이 필요합니다');
    });

    it('빈 texts 배열은 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/embeddings')
        .send({ texts: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('텍스트 배열이 필요합니다');
    });

    it('잘못된 texts 형식은 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/embeddings')
        .send({ texts: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('텍스트 배열이 필요합니다');
    });

    it('유효한 texts로 Gemini API를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          embeddings: [
            { values: [0.1, 0.2, 0.3] },
            { values: [0.4, 0.5, 0.6] }
          ]
        })
      });

      const response = await request(app)
        .post('/api/embeddings')
        .send({ texts: ['text1', 'text2'] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('embeddings');
      expect(Array.isArray(response.body.embeddings)).toBe(true);
    });

    it('Gemini API 오류를 처리한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'API Error'
      });

      const response = await request(app)
        .post('/api/embeddings')
        .send({ texts: ['text1'] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Embedding 처리 실패');
    });
  });

  describe('POST /api/advisory', () => {
    it('contents가 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/advisory')
        .send({ systemInstruction: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('요청 데이터가 필요합니다');
    });

    it('systemInstruction이 없으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/advisory')
        .send({ contents: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('요청 데이터가 필요합니다');
    });

    it('요청 본문이 비어있으면 400 에러를 반환한다', async () => {
      const response = await request(app)
        .post('/api/advisory')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('요청 데이터가 필요합니다');
    });

    it('유효한 요청으로 Gemini API를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"advice": "test advice"}' }]
              }
            }
          ]
        })
      });

      const response = await request(app)
        .post('/api/advisory')
        .send({
          contents: 'test contents',
          systemInstruction: 'test instruction'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('text');
    });

    it('Gemini API 오류를 처리한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'API Error'
      });

      const response = await request(app)
        .post('/api/advisory')
        .send({
          contents: 'test',
          systemInstruction: 'test'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('AI 조언 생성 실패');
    });
  });

  describe('에러 처리 미들웨어', () => {
    it('파일 크기 초과 오류를 처리한다', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload')
        .attach('file', largeBuffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('5MB');
    });
  });
});
