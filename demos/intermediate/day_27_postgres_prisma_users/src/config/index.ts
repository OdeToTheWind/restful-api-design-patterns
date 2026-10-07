import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3026,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  // Comma-separated allow-list, e.g. "http://localhost:5173". Unset = no cross-origin access.
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [],
};
