import { PrismaClient } from '../../generated/prisma';
import { countOperation } from './operation-counter';

// Single PrismaClient per process — every module imports this instance
// instead of calling `new PrismaClient()` (each one opens its own connection pool).
const prisma = new PrismaClient().$extends({
  name: 'operation-counter',
  query: {
    $allOperations: ({ args, query }) => {
      countOperation();
      return query(args);
    },
  },
});

export default prisma;
