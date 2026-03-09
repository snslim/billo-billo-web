import pino from 'pino';
import { requestStore } from '../middlewares/requestContext.js';

const isTest = process.env.NODE_ENV === 'test';

const baseLogger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  mixin() {
    const context = requestStore.getStore();
    return context ? { requestId: context.requestId } : {};
  },
});

export { baseLogger as logger };
