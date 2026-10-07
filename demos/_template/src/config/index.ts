import dotenv from 'dotenv';

dotenv.config();

// Use for secrets: fail fast at startup instead of falling back to a value committed to git
export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  // Comma-separated allow-list, e.g. "http://localhost:5173". Unset = no cross-origin access.
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [],
};
