import prisma from './lib/prisma';
import { deleteObject } from './lib/storage';
import { config } from './config';
import { logger } from '@restful/shared';

export const runCleanup = async (): Promise<{ cleanedCount: number; cleanedIds: string[] }> => {
  const cutoff = new Date(Date.now() - config.uploadUrlTtlSeconds * 1000);
  const abandoned = await prisma.file.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
  });

  const cleanedIds: string[] = [];
  for (const file of abandoned) {
    await deleteObject(file.key);
    await prisma.file.delete({ where: { id: file.id } });
    cleanedIds.push(file.id);
  }

  logger.info(`Cleanup finished: removed ${cleanedIds.length} abandoned uploads`, { cleanedIds });
  return { cleanedCount: cleanedIds.length, cleanedIds };
};

if (require.main === module) {
  runCleanup()
    .then((result) => {
      console.log(`Cleaned ${result.cleanedCount} abandoned upload(s).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Cleanup job failed:', err);
      process.exit(1);
    });
}
