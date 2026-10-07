import { join } from 'node:path';
import { loadEnv } from '@restful/shared';
import { loadEnvFiles } from './env-files';
import { envSchema } from './schema';

export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  port: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  corsOrigins: string[];
  rateLimitPerMinute: number;
  features: { newGreeting: boolean };
  adminApiKey: string | undefined;
  /** Which .env files were found, for diagnostics */
  loadedFiles: string[];
}

const demoRoot = join(__dirname, '..', '..');

/**
 * Builds the typed config once at startup. The rest of the app receives this object and never
 * reads process.env directly — so tests can pass any config they like.
 */
export const loadConfig = (
  source: NodeJS.ProcessEnv = process.env,
  options: { envDir?: string | false } = {},
): AppConfig => {
  const nodeEnv = source.NODE_ENV ?? 'development';
  const loadedFiles = options.envDir === false ? [] : loadEnvFiles(options.envDir ?? demoRoot, nodeEnv);
  const env = loadEnv(envSchema, source);

  return {
    environment: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    corsOrigins: env.CORS_ORIGIN,
    rateLimitPerMinute: env.RATE_LIMIT_PER_MINUTE,
    features: { newGreeting: env.FEATURE_NEW_GREETING },
    adminApiKey: env.ADMIN_API_KEY,
    loadedFiles,
  };
};

/** Safe to show to an operator: secrets are reduced to "set" / "not set". */
export const redactConfig = (config: AppConfig) => ({
  ...config,
  adminApiKey: config.adminApiKey ? '[set]' : '[not set]',
});
