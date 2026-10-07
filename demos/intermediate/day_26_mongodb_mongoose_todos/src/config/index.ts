import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3025,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/restful-api-day26',
  // Comma-separated allow-list, e.g. "http://localhost:5173". Unset = no cross-origin access.
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [],
};
