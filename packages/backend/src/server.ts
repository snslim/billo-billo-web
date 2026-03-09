import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const requiredEnvVars = ['FRONTEND_URL', 'UPSTAGE_API_KEY', 'NTS_API_KEY', 'GEMINI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} 환경 변수가 설정되지 않았습니다`);
  }
}

const { app } = await import('./app.js');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`서버 실행 중: 포트 ${PORT}`);
});

export { app, server };
