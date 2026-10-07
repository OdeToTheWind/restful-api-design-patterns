import { startServer } from '@restful/shared';
import app from './app';
import { config } from './config';

startServer(app, { port: config.port, name: 'Day 30' });
