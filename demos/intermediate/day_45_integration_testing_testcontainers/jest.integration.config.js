/**
 * Integration tests against a real PostgreSQL (Testcontainers). Needs Docker.
 * Run with `pnpm test:integration`; the unit suite (`pnpm test`) never touches a database.
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/__integration__/**/*.int.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/integration.global-setup.js',
  globalTeardown: '<rootDir>/integration.global-teardown.js',
  // One database for the whole suite: run files one after another
  maxWorkers: 1,
  testTimeout: 30_000,
};
