/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // Real-database tests have their own config (jest.integration.config.js)
  testPathIgnorePatterns: ['/node_modules/', '/__integration__/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Excluded: entry points (only listen()), env plumbing, and lib/prisma (always mocked)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
    '!src/lib/**',
    '!src/**/__tests__/**',
    '!src/**/__integration__/**',
  ],
  coverageThreshold: { global: { branches: 70, functions: 70, lines: 70, statements: 70 } },
};
