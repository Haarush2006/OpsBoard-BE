

import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { ApiResponse } from '../../utils/response';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import logger from '../../utils/logger';
import User from '../users/user.model';
import { UnauthorizedError } from '../../utils/errors';

export class AuthController {
  // Register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      logger.info('User registered', {
        userId: result.user.id,
        email: result.user.email,
        requestId: req.id
      });

      return ApiResponse.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      logger.info('User logged in', {
        userId: result.user.id,
        email: result.user.email,
        requestId: req.id,
        ip: req.ip
      });

      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // Refresh tokens
      const result = await authService.refreshAccessToken(refreshToken);

      logger.info('Token refreshed', {
        requestId: req.id
      });

      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      logger.info('User logged out', {
        userId: (req as any).user?.userId,
        requestId: req.id
      });

      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  // Logout from all devices
  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      const result = await authService.logoutAll(userId);

      logger.info('User logged out from all devices', {
        userId,
        deletedTokens: result.deletedCount,
        requestId: req.id
      });

      return ApiResponse.success(
        res,
        { deletedSessions: result.deletedCount },
        'Logged out from all devices successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      const user = await User.findById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return ApiResponse.success(res, { user });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();