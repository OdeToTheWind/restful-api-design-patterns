// config/index.ts validates the environment on import; tests never read the real .env
// Integration runs get the real URL from integration.global-setup.js
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
