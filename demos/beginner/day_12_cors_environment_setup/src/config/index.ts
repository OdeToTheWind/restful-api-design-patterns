import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3011,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',
};