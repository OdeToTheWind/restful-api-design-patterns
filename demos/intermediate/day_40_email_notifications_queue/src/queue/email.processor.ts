import { UnrecoverableError, type Job } from 'bullmq';
import type { Transporter } from 'nodemailer';
import { logger } from '@restful/shared';
import type { EmailRequest } from '../emails/schema';
import { renderEmail } from '../emails/templates';

/**
 * Sends one email. Throwing makes BullMQ retry with backoff — right for temporary problems
 * (SMTP server down, 4xx greylisting). A permanent rejection (5xx, e.g. unknown mailbox)
 * will never succeed, so it's thrown as UnrecoverableError to stop retrying immediately.
 */
export const createEmailProcessor =
  (transport: Transporter, from: string) =>
  async (job: Job<EmailRequest>): Promise<{ messageId: string }> => {
    const email = renderEmail(job.data);
    try {
      const info = await transport.sendMail({ from, to: job.data.to, ...email });
      logger.info('email sent', { jobId: job.id, type: job.data.type, attempt: job.attemptsMade + 1 });
      return { messageId: String(info.messageId) };
    } catch (error) {
      const responseCode = (error as { responseCode?: number }).responseCode;
      if (responseCode !== undefined && responseCode >= 500) {
        logger.error('email permanently rejected', { jobId: job.id, responseCode });
        throw new UnrecoverableError(`SMTP ${responseCode}: ${(error as Error).message}`);
      }
      logger.warn('email failed, will retry', {
        jobId: job.id,
        attempt: job.attemptsMade + 1,
        error: (error as Error).message,
      });
      throw error;
    }
  };
