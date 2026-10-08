import request from 'supertest';
import nodemailer from 'nodemailer';
import { UnrecoverableError, type Job } from 'bullmq';
import { createContractMatcher } from '@restful/shared/testing';
import { createApp } from '../app';
import { openApiDocument } from '../docs/openapi';
import type { EmailRequest } from '../emails/schema';
import { renderEmail } from '../emails/templates';
import { createEmailProcessor } from '../queue/email.processor';
import type { EmailQueue } from '../queue/email.queue';

const expectToMatchSpec = createContractMatcher(openApiDocument);

/** A tiny in-memory stand-in for the BullMQ queue (the real one is exercised by `pnpm smoke`) */
const fakeQueue = () => {
  const jobs = new Map<string, { id: string; data: EmailRequest; state: string; attemptsMade: number }>();
  let counter = 0;
  const queue = {
    add: jest.fn(async (_name: string, data: EmailRequest, opts?: { jobId?: string }) => {
      const id = opts?.jobId ?? String(++counter);
      if (!jobs.has(id)) jobs.set(id, { id, data, state: 'waiting', attemptsMade: 0 });
      return { id };
    }),
    getJob: jest.fn(async (id: string) => {
      const job = jobs.get(id);
      if (!job) return undefined;
      return {
        ...job,
        failedReason: job.state === 'failed' ? 'SMTP 550 permanent failure' : undefined,
        finishedOn: job.state === 'failed' ? Date.now() : undefined,
        getState: async () => job.state,
        retry: jest.fn(async () => {
          job.state = 'waiting';
        }),
      };
    }),
    getFailed: jest.fn(async () => {
      return [...jobs.values()]
        .filter((j) => j.state === 'failed')
        .map((j) => ({
          ...j,
          failedReason: 'SMTP 550 permanent failure',
          finishedOn: Date.now(),
          getState: async () => j.state,
          retry: jest.fn(async () => {
            j.state = 'waiting';
          }),
        }));
    }),
  };
  return { queue: queue as unknown as EmailQueue & typeof queue, jobs };
};

const welcome: EmailRequest = { type: 'welcome', to: 'ADA@example.com', data: { name: 'Ada' } };

describe('POST /api/emails', () => {
  it('queues the email and answers 202 with a status URL — nothing is sent in the request', async () => {
    const { queue } = fakeQueue();
    const res = await request(createApp({ queue })).post('/api/emails').send(welcome);

    expect(res.status).toBe(202);
    expect(res.headers.location).toBe(`/api/emails/${res.body.data.jobId}`);
    expect(queue.add).toHaveBeenCalledWith(
      'welcome',
      { type: 'welcome', to: 'ada@example.com', data: { name: 'Ada' } },
      { jobId: undefined },
    );
    expectToMatchSpec(res, 'post', '/api/emails');
  });

  it('an Idempotency-Key maps to one job: retrying the request never sends twice', async () => {
    const { queue, jobs } = fakeQueue();
    const app = createApp({ queue });

    const first = await request(app).post('/api/emails').set('Idempotency-Key', 'signup-ada-0001').send(welcome);
    const retry = await request(app).post('/api/emails').set('Idempotency-Key', 'signup-ada-0001').send(welcome);

    expect([first.status, retry.status]).toEqual([202, 200]);
    expect(retry.body.data).toMatchObject({ jobId: 'email-signup-ada-0001', duplicate: true });
    expect(jobs.size).toBe(1);
    expectToMatchSpec(retry, 'post', '/api/emails');
  });

  it.each([
    [{ type: 'newsletter', to: 'a@b.co', data: {} }],
    [{ type: 'welcome', to: 'not-an-email', data: { name: 'A' } }],
    [{ type: 'order-confirmation', to: 'a@b.co', data: { orderId: 'o1' } }],
  ])('rejects %p with 400', async (body) => {
    const { queue } = fakeQueue();
    expect((await request(createApp({ queue })).post('/api/emails').send(body)).status).toBe(400);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects an unsafe Idempotency-Key', async () => {
    const { queue } = fakeQueue();
    const res = await request(createApp({ queue })).post('/api/emails').set('Idempotency-Key', 'x y').send(welcome);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/emails/:jobId', () => {
  it('reports the job state, or 404 once it is gone', async () => {
    const { queue } = fakeQueue();
    const app = createApp({ queue });
    const { body } = await request(app).post('/api/emails').send(welcome);

    const status = await request(app).get(body.data.statusUrl);
    expect(status.body.data).toMatchObject({
      jobId: body.data.jobId,
      type: 'welcome',
      state: 'waiting',
      attemptsMade: 0,
    });
    expectToMatchSpec(status, 'get', '/api/emails/{jobId}');
    expectToMatchSpec(await request(app).get('/api/emails/missing'), 'get', '/api/emails/{jobId}');
  });

  it('serves health with the injected readiness check', async () => {
    const { queue } = fakeQueue();
    const app = createApp({ queue, readinessChecks: { redis: () => Promise.reject(new Error('down')) } });
    expect((await request(app).get('/ready')).status).toBe(503);
  });
});

describe('templates', () => {
  it('renders each email type and escapes user data in HTML', () => {
    const email = renderEmail({ type: 'welcome', to: 'a@b.co', data: { name: '<script>alert(1)</script>' } });
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).not.toContain('<script>');

    expect(
      renderEmail({ type: 'order-confirmation', to: 'a@b.co', data: { orderId: 'A-1', totalCents: 4599 } }),
    ).toMatchObject({
      subject: 'Order A-1 confirmed',
      text: 'Your order A-1 ($45.99) is confirmed.',
    });
  });
});

describe('email processor (worker side)', () => {
  const job = (attemptsMade = 0) => ({ id: 'j1', attemptsMade, data: welcome as EmailRequest }) as Job<EmailRequest>;

  it('sends a fully formed message through the transport', async () => {
    // jsonTransport builds the real MIME message without any network
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const result = await createEmailProcessor(transport, 'Day 40 <no-reply@example.com>')(job());
    expect(result.messageId).toMatch(/@/);
  });

  it('rethrows temporary failures so BullMQ retries with backoff', async () => {
    const transport = {
      sendMail: jest.fn().mockRejectedValue(Object.assign(new Error('try later'), { responseCode: 421 })),
    };
    const run = createEmailProcessor(transport as never, 'from@example.com')(job());
    await expect(run).rejects.toThrow('try later');
    await expect(run).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  it('stops retrying on a permanent rejection (SMTP 5xx)', async () => {
    const transport = {
      sendMail: jest.fn().mockRejectedValue(Object.assign(new Error('mailbox unavailable'), { responseCode: 550 })),
    };
    await expect(createEmailProcessor(transport as never, 'from@example.com')(job())).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
  });

  it('treats network errors (no SMTP code) as temporary', async () => {
    const transport = { sendMail: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) };
    await expect(createEmailProcessor(transport as never, 'from@example.com')(job(2))).rejects.toThrow('ECONNREFUSED');
  });
});

describe('Dead-letter endpoints', () => {
  const adminKey = 'day40-admin-secret-key';

  it('rejects unauthenticated requests with 401', async () => {
    const { queue } = fakeQueue();
    const app = createApp({ queue });

    const noKeyRes = await request(app).get('/api/admin/emails/failed');
    expect(noKeyRes.status).toBe(401);
    expectToMatchSpec(noKeyRes, 'get', '/api/admin/emails/failed');

    const wrongKeyRes = await request(app)
      .post('/api/admin/emails/failed/failed-job-1/retry')
      .set('X-Admin-Key', 'wrong-key');
    expect(wrongKeyRes.status).toBe(401);
    expectToMatchSpec(wrongKeyRes, 'post', '/api/admin/emails/failed/{jobId}/retry');
  });

  it('lists failed jobs and allows re-queuing with valid admin key', async () => {
    const { queue, jobs } = fakeQueue();
    jobs.set('failed-job-1', {
      id: 'failed-job-1',
      data: welcome,
      state: 'failed',
      attemptsMade: 3,
    });
    const app = createApp({ queue });

    const listRes = await request(app).get('/api/admin/emails/failed').set('X-Admin-Key', adminKey);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.count).toBe(1);
    expect(listRes.body.data.jobs[0].jobId).toBe('failed-job-1');
    expectToMatchSpec(listRes, 'get', '/api/admin/emails/failed');

    const retryRes = await request(app)
      .post('/api/admin/emails/failed/failed-job-1/retry')
      .set('X-Admin-Key', adminKey);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.retried).toBe(true);
    expectToMatchSpec(retryRes, 'post', '/api/admin/emails/failed/{jobId}/retry');
  });

  it('404 on missing failed job and 409 if job is not in failed state', async () => {
    const { queue, jobs } = fakeQueue();
    jobs.set('active-job', {
      id: 'active-job',
      data: welcome,
      state: 'active',
      attemptsMade: 1,
    });
    const app = createApp({ queue });

    const notFoundRes = await request(app)
      .post('/api/admin/emails/failed/missing-job/retry')
      .set('X-Admin-Key', adminKey);
    expect(notFoundRes.status).toBe(404);

    const conflictRes = await request(app)
      .post('/api/admin/emails/failed/active-job/retry')
      .set('X-Admin-Key', adminKey);
    expect(conflictRes.status).toBe(409);
  });
});
