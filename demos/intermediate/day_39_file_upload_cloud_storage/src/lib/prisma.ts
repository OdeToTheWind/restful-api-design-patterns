import { PrismaClient } from '../../generated/prisma';

// Single PrismaClient per process — every module imports this instance
// instead of calling `new PrismaClient()` (each one opens its own connection pool).
const prisma = new PrismaClient();

export default prisma;
