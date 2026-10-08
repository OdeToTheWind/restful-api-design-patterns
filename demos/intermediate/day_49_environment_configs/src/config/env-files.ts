import { existsSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';

/**
 * Files are loaded from most to least specific. dotenv never overrides a variable that is
 * already set, so the first file to define a value wins — and real environment variables
 * (from Docker, CI, the shell) beat every file.
 *
 *   1. .env.<NODE_ENV>.local   machine-specific overrides, git-ignored
 *   2. .env.local              git-ignored; skipped in tests so they're reproducible
 *   3. .env.<NODE_ENV>         committed, non-secret defaults for that environment
 *   4. .env                    git-ignored, your local secrets
 */
export const envFilesFor = (nodeEnv: string): string[] =>
  [`.env.${nodeEnv}.local`, nodeEnv === 'test' ? null : '.env.local', `.env.${nodeEnv}`, '.env'].filter(
    (file): file is string => file !== null,
  );

/** Loads the files that exist into process.env and returns their names, in load order. */
export const loadEnvFiles = (dir: string, nodeEnv: string): string[] =>
  envFilesFor(nodeEnv).filter((file) => {
    const path = join(dir, file);
    if (!existsSync(path)) return false;
    dotenv.config({ path });
    return true;
  });
