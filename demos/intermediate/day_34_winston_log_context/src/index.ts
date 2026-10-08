import { logger, startServer } from '@restful/shared';
import { createApp } from './app';
import { config } from './config';
import { RecentLogsTransport } from './lib/recent-logs';

const recentLogs = config.exposeRecentLogs ? new RecentLogsTransport() : undefined;
if (recentLogs) logger.add(recentLogs);

startServer(createApp(config, undefined, recentLogs), { port: config.port, name: 'Day 34' });
logger.info(`Log level: ${config.logLevel}`);
