import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

interface RequestContext {
  requestId: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();

export function requestContext(req: Request, _res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  requestStore.run({ requestId }, next);
}
