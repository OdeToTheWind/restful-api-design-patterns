import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import { openApiDocument } from '../docs/openapi';

const expectToMatchSpec = createContractMatcher(openApiDocument);

it('every error path matches its documented response', async () => {
  for (const path of ['/api/test/success', '/api/test/bad-request', '/api/test/not-found', '/api/test/server-error']) {
    expectToMatchSpec(await request(app).get(path), 'get', path);
  }
});
