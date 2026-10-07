import { Router } from 'express';
import { ApiResponse } from './response';

/** A readiness check resolves when the dependency is usable and rejects (or times out) when not. */
export type HealthCheck = () => Promise<unknown>;

const withTimeout = (check: HealthCheck, ms: number): Promise<unknown> =>
  Promise.race([
    check(),
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms).unref()),
  ]);

/**
 * GET /health — liveness: the process is up and serving requests (never touches dependencies).
 * GET /ready  — readiness: every check passes (e.g. database ping); 503 otherwise.
 * Orchestrators (Docker, Kubernetes, load balancers) restart on failed liveness and stop
 * routing traffic on failed readiness.
 */
export const healthRouter = (checks: Record<string, HealthCheck> = {}, timeoutMs = 2000): Router => {
  const router = Router();

  router.get('/health', (_req, res) => {
    ApiResponse.success(res, { status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  router.get('/ready', async (_req, res) => {
    const results = await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        try {
          await withTimeout(check, timeoutMs);
          return [name, 'up'] as const;
        } catch {
          return [name, 'down'] as const;
        }
      }),
    );
    const status = Object.fromEntries(results);

    if (results.some(([, state]) => state === 'down')) {
      ApiResponse.error(res, 'Service not ready', 503, status);
      return;
    }
    ApiResponse.success(res, { status: 'ready', checks: status });
  });

  return router;
};
