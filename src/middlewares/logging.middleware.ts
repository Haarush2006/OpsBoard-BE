import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id,
      ip: req.ip
    });
  });

  next();
};