// config/index.ts validates the environment on import; tests never read the real .env
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.WEBHOOK_SECRET = 'whsec_test_only_secret_at_least_32_chars';
