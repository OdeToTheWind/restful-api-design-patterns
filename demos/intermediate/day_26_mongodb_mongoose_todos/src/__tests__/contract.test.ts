import mongoose from 'mongoose';
import request from 'supertest';
import { createContractMatcher } from '@restful/shared/testing';
import app from '../app';
import Todo from '../models/Todo.model';
import { openApiDocument } from '../docs/openapi';

const expectToMatchSpec = createContractMatcher(openApiDocument);
const id = new mongoose.Types.ObjectId().toString();
const todo = { _id: id, title: 'Write docs', completed: false, createdAt: new Date().toISOString(), __v: 0 };

afterEach(() => jest.restoreAllMocks());

it('responses match the OpenAPI document', async () => {
  jest.spyOn(Todo, 'find').mockReturnValue({ sort: jest.fn().mockResolvedValue([todo]) } as never);
  expectToMatchSpec(await request(app).get('/api/todos'), 'get', '/api/todos');

  jest.spyOn(Todo, 'create').mockResolvedValue(todo as never);
  expectToMatchSpec(await request(app).post('/api/todos').send({ title: 'Write docs' }), 'post', '/api/todos');
  expectToMatchSpec(await request(app).post('/api/todos').send({}), 'post', '/api/todos');

  jest.spyOn(Todo, 'findByIdAndUpdate').mockResolvedValue(null as never);
  expectToMatchSpec(await request(app).put(`/api/todos/${id}`).send({ completed: true }), 'put', '/api/todos/{id}');

  jest.spyOn(Todo, 'findByIdAndDelete').mockResolvedValue(todo as never);
  expectToMatchSpec(await request(app).delete(`/api/todos/${id}`), 'delete', '/api/todos/{id}');
  expectToMatchSpec(await request(app).delete('/api/todos/not-an-id'), 'delete', '/api/todos/{id}');
});
