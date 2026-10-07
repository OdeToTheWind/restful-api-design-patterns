// Starts a throwaway PostgreSQL in Docker and applies the real migrations before the
// integration suite runs. Workers inherit DATABASE_URL from this process.
const { execFileSync } = require('node:child_process');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

module.exports = async () => {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  process.env.DATABASE_URL = `${container.getConnectionUri()}?schema=public`;
  globalThis.__POSTGRES__ = container;

  execFileSync(require.resolve('prisma/build/index.js'), ['migrate', 'deploy'], {
    cwd: __dirname,
    env: process.env,
    stdio: 'pipe',
  });
};
