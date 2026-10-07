import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3013,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};