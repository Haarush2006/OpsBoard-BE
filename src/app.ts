import express, { Application } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { ApiResponse } from './utils/response';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(loggingMiddleware);


app.get('/health', (req, res) => {
  ApiResponse.success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.use('/api/auth', (req, res) => {
  ApiResponse.success(res, { message: 'Auth routes - Coming soon!' });
});

app.use('/{*splat}', (req, res) => {
  ApiResponse.error(res, 'Route not found', 404);
});


app.use(errorHandler);

export default app;