import type { Server } from 'node:http';
import type { Application } from 'express';
import { logger } from './logger';

export interface StartServerOptions {
  port: number | string;
  /** Shown in log lines, e.g. "Day 29". */
  name: string;
  /** Run after the server stops accepting connections — e.g. `() => prisma.$disconnect()`. */
  onShutdown?: Array<() => Promise<unknown>>;
  /** Force exit if in-flight requests or hooks take longer than this. */
  shutdownTimeoutMs?: number;
  /** Injectable for tests. */
  exit?: (code: number) => void;
}

export interface RunningServer {
  server: Server;
  /** Stops accepting connections, waits for in-flight requests, runs hooks, then exits. Idempotent. */
  shutdown: (reason: string) => Promise<void>;
}

/**
 * Starts the app and installs SIGTERM/SIGINT handlers for a graceful shutdown, so a restart
 * (Ctrl+C, `docker stop`, a deploy) never cuts requests off mid-flight or leaks DB connections.
 */
export const startServer = (app: Application, options: StartServerOptions): RunningServer => {
  const { name, onShutdown = [], shutdownTimeoutMs = 10_000, exit = (code) => process.exit(code) } = options;

  const server = app.listen(options.port, () => {
    logger.info(`${name} listening on http://localhost:${options.port}`);
  });

  let shuttingDown: Promise<void> | undefined;

  const shutdown = (reason: string): Promise<void> => {
    shuttingDown ??= (async () => {
      logger.info(`${name} shutting down (${reason})`);
      const force = setTimeout(() => {
        logger.error(`${name} did not shut down within ${shutdownTimeoutMs}ms, forcing exit`);
        exit(1);
      }, shutdownTimeoutMs);
      force.unref();

      let code = 0;
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
          server.closeIdleConnections(); // keep-alive sockets would otherwise hold close() open
        });
        for (const hook of onShutdown) await hook();
        logger.info(`${name} stopped cleanly`);
      } catch (error) {
        logger.error(`${name} shutdown failed`, { error });
        code = 1;
      } finally {
        clearTimeout(force);
        exit(code);
      }
    })();
    return shuttingDown;
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));

  return { server, shutdown };
};
