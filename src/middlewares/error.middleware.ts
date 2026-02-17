import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { ApiResponse } from '../utils/response';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method
  });
  
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errors
      }
    });
  }

  if (err.name === 'ValidationError') {
    return ApiResponse.error(res, 'Validation failed', 400, err.message);
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return ApiResponse.error(res, 'Duplicate entry', 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500
  );
};