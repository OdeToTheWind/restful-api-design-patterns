// Tests never read the real .env — config.ts requires JWT_SECRET to be set
process.env.JWT_SECRET = 'test-only-secret-not-used-anywhere-else';
process.env.NODE_ENV = 'test';
// One limiter is shared by every request in a test file; rate-limit.test.ts lowers this itself
process.env.AUTH_RATE_LIMIT = '1000';
