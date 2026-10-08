// config/index.ts validates the environment on import; tests never read the real .env
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_ACCESS_KEY_ID = 'test-key';
process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
