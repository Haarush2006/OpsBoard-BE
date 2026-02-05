import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
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

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return ApiResponse.error(res, 'Validation failed', 400, err.message);
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return ApiResponse.error(res, 'Duplicate entry', 409);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  // Default error
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500
  );
};