import Redis from 'ioredis';
import { config } from '../config';

// One connection per process. Fail fast instead of queueing commands while Redis is down:
// the cache is an optimisation, so requests should fall back to the database immediately.
const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
});

// Without a listener, ioredis reports every reconnect attempt as an unhandled 'error' event
redis.on('error', () => undefined);

export default redis;
