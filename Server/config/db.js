import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(label = 'api') {
  const safeUri = config.mongoUri.replace(/\/\/([^@/]+)@/, '//***@');

  mongoose.connection.on('disconnected', () => console.warn(`[${label}] MongoDB disconnected`));
  mongoose.connection.on('reconnected', () => console.log(`[${label}] MongoDB reconnected`));

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[${label}] MongoDB connected → ${safeUri}`);
  } catch (err) {
    console.error(`[${label}] MongoDB connection failed (${safeUri}):`, err.message);
    throw err;
  }
}
