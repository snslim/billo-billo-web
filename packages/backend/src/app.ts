import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestContext } from './middlewares/requestContext.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { ocrRoutes } from './routes/ocrRoutes.js';
import { validateRoutes } from './routes/validateRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';

const app = express();

const ALLOWED_ORIGINS = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(
  (origin): origin is string => Boolean(origin)
);

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());
app.use(requestContext);
app.use(requestLogger);

app.use('/api', healthRoutes);
app.use('/api', ocrRoutes);
app.use('/api', validateRoutes);
app.use('/api', aiRoutes);

app.use(errorHandler);

export { app };
