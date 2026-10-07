import { logger } from '@restful/shared';
import redis from './redis';
import { config } from '../config';

export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS';

/**
 * Cache-aside: read from Redis, on a miss load from the database and store the result.
 * Any Redis failure degrades to BYPASS (load from the database, don't cache) instead of an error.
 */
export const cached = async <T>(key: string, load: () => Promise<T>): Promise<{ value: T; status: CacheStatus }> => {
  let hit: string | null;
  try {
    hit = await redis.get(key);
  } catch (error) {
    logger.warn('Cache unavailable, reading from the database', { key, error: (error as Error).message });
    return { value: await load(), status: 'BYPASS' };
  }

  if (hit !== null) {
    return { value: JSON.parse(hit) as T, status: 'HIT' };
  }

  const value = await load();
  try {
    await redis.set(key, JSON.stringify(value), 'EX', config.cacheTtlSeconds);
  } catch (error) {
    logger.warn('Could not populate cache', { key, error: (error as Error).message });
  }
  return { value, status: 'MISS' };
};

/** Best-effort invalidation; the TTL bounds staleness if Redis is briefly unreachable. */
export const invalidate = async (...keys: string[]): Promise<void> => {
  try {
    await redis.del(...keys);
  } catch (error) {
    logger.warn('Cache invalidation failed; entries will expire via TTL', { keys, error: (error as Error).message });
  }
};

/**
 * List caches can't be invalidated by key (there is one per query), so their keys include a
 * version number. Bumping the version on any write makes every old list key unreachable.
 */
export const listVersion = async (namespace: string): Promise<string> => {
  try {
    return (await redis.get(`${namespace}:version`)) ?? '0';
  } catch {
    return 'unavailable';
  }
};

export const bumpListVersion = async (namespace: string): Promise<void> => {
  try {
    await redis.incr(`${namespace}:version`);
  } catch (error) {
    logger.warn('Could not bump list version', { namespace, error: (error as Error).message });
  }
};
