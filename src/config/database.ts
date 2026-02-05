import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI

    await mongoose.connect(mongoUri!);
    
    logger.info('✅ Connected to MongoDB', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
  } catch (error: any) {
    logger.error('❌ MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error', { error: error.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});