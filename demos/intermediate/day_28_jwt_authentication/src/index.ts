import { logger, startServer } from '@restful/shared';
import app from './app';
import { config } from './config';
import prisma from './lib/prisma';

// SIGTERM/SIGINT: stop accepting requests, finish in-flight ones, then close the DB pool
startServer(app, { port: config.port, name: 'Day 28', onShutdown: [() => prisma.$disconnect()] });
logger.info('🔐 JWT auth ready — POST /api/auth/register | /login | /refresh | /logout');
