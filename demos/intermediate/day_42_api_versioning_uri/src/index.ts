import { startServer } from '@restful/shared';
import { createApp } from './app';
import { config } from './config';

startServer(createApp(config), { port: config.port, name: 'Day 42' });
