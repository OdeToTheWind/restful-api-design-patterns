import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, redactConfig } from '../config';
import { envFilesFor, loadEnvFiles } from '../config/env-files';

const KEY = 'k'.repeat(32);

describe('loadConfig (schema)', () => {
  it('applies development defaults and coerces types', () => {
    const config = loadConfig(
      { PORT: '4000', FEATURE_NEW_GREETING: 'yes', CORS_ORIGIN: 'http://a.test,http://b.test' },
      { envDir: false },
    );

    expect(config).toEqual({
      environment: 'development',
      port: 4000,
      logLevel: 'info',
      corsOrigins: ['http://a.test', 'http://b.test'],
      rateLimitPerMinute: 120,
      features: { newGreeting: true },
      adminApiKey: undefined,
      loadedFiles: [],
    });
  });

  it('production requires an admin key, explicit origins and no debug logging — all reported together', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'production', CORS_ORIGIN: '*', LOG_LEVEL: 'debug' }, { envDir: false }),
    ).toThrow(
      /ADMIN_API_KEY: is required in production[\s\S]*CORS_ORIGIN: must list explicit origins[\s\S]*LOG_LEVEL: debug logging is not allowed/,
    );
  });

  it('accepts a valid production configuration', () => {
    const config = loadConfig(
      { NODE_ENV: 'production', ADMIN_API_KEY: KEY, CORS_ORIGIN: 'https://app.example.com' },
      { envDir: false },
    );
    expect(config.environment).toBe('production');
  });

  it.each([
    [{ PORT: 'eighty' }, /PORT/],
    [{ RATE_LIMIT_PER_MINUTE: '0' }, /RATE_LIMIT_PER_MINUTE/],
    [{ FEATURE_NEW_GREETING: 'maybe' }, /FEATURE_NEW_GREETING/],
    [{ ADMIN_API_KEY: 'short' }, /ADMIN_API_KEY: must be at least 32 characters/],
    [{ NODE_ENV: 'staging' }, /NODE_ENV/],
  ])('rejects %p', (env, message) => {
    expect(() => loadConfig(env, { envDir: false })).toThrow(message);
  });

  it('redacts secrets for display', () => {
    const config = loadConfig({ ADMIN_API_KEY: KEY }, { envDir: false });
    expect(redactConfig(config).adminApiKey).toBe('[set]');
    expect(JSON.stringify(redactConfig(config))).not.toContain(KEY);
  });
});

describe('.env file layering', () => {
  const dirWith = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), 'day49-'));
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
    return dir;
  };

  const VARS = ['LOG_LEVEL', 'RATE_LIMIT_PER_MINUTE', 'FEATURE_NEW_GREETING', 'CORS_ORIGIN'];
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = Object.fromEntries(VARS.map((name) => [name, process.env[name]]));
    VARS.forEach((name) => delete process.env[name]);
  });
  afterEach(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('orders files from most to least specific, skipping .env.local in tests', () => {
    expect(envFilesFor('production')).toEqual(['.env.production.local', '.env.local', '.env.production', '.env']);
    expect(envFilesFor('test')).toEqual(['.env.test.local', '.env.test', '.env']);
  });

  it('the most specific file wins, and real environment variables beat every file', () => {
    const dir = dirWith({
      '.env':
        'LOG_LEVEL=warn\nRATE_LIMIT_PER_MINUTE=1\nFEATURE_NEW_GREETING=false\nCORS_ORIGIN=http://from-dotenv.test',
      '.env.development': 'LOG_LEVEL=debug\nRATE_LIMIT_PER_MINUTE=2',
      '.env.development.local': 'RATE_LIMIT_PER_MINUTE=3',
    });
    process.env.FEATURE_NEW_GREETING = 'true'; // e.g. set by Docker

    const loaded = loadEnvFiles(dir, 'development');

    expect(loaded).toEqual(['.env.development.local', '.env.development', '.env']);
    expect(process.env).toMatchObject({
      RATE_LIMIT_PER_MINUTE: '3', // .env.development.local
      LOG_LEVEL: 'debug', // .env.development
      CORS_ORIGIN: 'http://from-dotenv.test', // .env
      FEATURE_NEW_GREETING: 'true', // real env var
    });
  });

  it('loadConfig reads the files and reports which ones it used', () => {
    const dir = dirWith({ '.env.test': 'RATE_LIMIT_PER_MINUTE=7', '.env.local': 'RATE_LIMIT_PER_MINUTE=999' });

    const config = loadConfig(process.env, { envDir: dir });

    expect(config.rateLimitPerMinute).toBe(7);
    expect(config.loadedFiles).toEqual(['.env.test']);
  });
});
