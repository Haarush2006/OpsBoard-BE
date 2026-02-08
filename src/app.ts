import express, { Application } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/response';

// Import routes
import authRoutes from './modules/auth/auth.routes';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(loggingMiddleware);

// Health check
app.get('/health', (req, res) => {
  ApiResponse.success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  ApiResponse.error(res, 'Route not found', 404);
});

// Error handler (must be last)
app.use(errorHandler);

export default app;