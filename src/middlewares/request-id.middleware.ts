import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};