// config/index.ts validates the environment on import; tests never read the real .env
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
