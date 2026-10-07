/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Excluded: entry points (only listen()), env plumbing, lib/prisma (always mocked) and the
  // generate.ts CLI (exercised by contract.test.ts in a child process)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
    '!src/lib/**',
    '!src/contract/generate.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: { global: { branches: 70, functions: 70, lines: 70, statements: 70 } },
};
