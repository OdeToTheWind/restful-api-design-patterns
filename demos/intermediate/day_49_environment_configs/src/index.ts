import { logger, startServer } from '@restful/shared';
import { createApp } from './app';
import { loadConfig } from './config';

// Load and validate once; an invalid environment stops the process here with every problem listed
const config = loadConfig();
logger.info(`Configuration loaded for ${config.environment}`, { files: config.loadedFiles });

startServer(createApp(config), { port: config.port, name: 'Day 49' });
