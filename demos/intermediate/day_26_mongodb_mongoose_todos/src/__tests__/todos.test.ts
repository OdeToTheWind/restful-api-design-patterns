import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Todo from '../models/Todo.model';

// No MongoDB needed: the model's static methods are stubbed per test
const id = new mongoose.Types.ObjectId().toString();
const todo = { _id: id, title: 'Write tests', completed: false, createdAt: new Date().toISOString() };
const castError = () => new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id');

afterEach(() => jest.restoreAllMocks());

describe('GET /api/todos', () => {
  it('returns todos sorted newest first', async () => {
    const sort = jest.fn().mockResolvedValue([todo]);
    jest.spyOn(Todo, 'find').mockReturnValue({ sort } as never);

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([todo]);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('turns a database failure into a generic 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Todo, 'find').mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('db down')) } as never);

    const res = await request(app).get('/api/todos');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});

describe('POST /api/todos', () => {
  it('creates a todo from the validated body only', async () => {
    const create = jest.spyOn(Todo, 'create').mockResolvedValue(todo as never);

    const res = await request(app).post('/api/todos').send({ title: '  Write tests  ', completed: true, owner: 'x' });

    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith({ title: 'Write tests' });
  });

  it('rejects a missing title with 400', async () => {
    const create = jest.spyOn(Todo, 'create');

    const res = await request(app).post('/api/todos').send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/todos/:id', () => {
  it('updates only the provided fields and runs schema validators', async () => {
    const update = jest.spyOn(Todo, 'findByIdAndUpdate').mockResolvedValue({ ...todo, completed: true } as never);

    const res = await request(app).put(`/api/todos/${id}`).send({ completed: true });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(id, { completed: true }, { new: true, runValidators: true });
  });

  it('returns 404 when the todo does not exist', async () => {
    jest.spyOn(Todo, 'findByIdAndUpdate').mockResolvedValue(null as never);

    expect((await request(app).put(`/api/todos/${id}`).send({ completed: true })).status).toBe(404);
  });

  it('rejects a non-boolean "completed" with 400', async () => {
    expect((await request(app).put(`/api/todos/${id}`).send({ completed: 'yes' })).status).toBe(400);
  });

  it('maps an invalid ObjectId (CastError) to 400', async () => {
    jest.spyOn(Todo, 'findByIdAndUpdate').mockRejectedValue(castError());

    const res = await request(app).put('/api/todos/not-an-id').send({ completed: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid id format');
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes an existing todo', async () => {
    jest.spyOn(Todo, 'findByIdAndDelete').mockResolvedValue(todo as never);
    expect((await request(app).delete(`/api/todos/${id}`)).status).toBe(200);
  });

  it('returns 404 when the todo does not exist', async () => {
    jest.spyOn(Todo, 'findByIdAndDelete').mockResolvedValue(null as never);
    expect((await request(app).delete(`/api/todos/${id}`)).status).toBe(404);
  });

  it('maps an invalid ObjectId (CastError) to 400', async () => {
    jest.spyOn(Todo, 'findByIdAndDelete').mockRejectedValue(castError());
    expect((await request(app).delete('/api/todos/not-an-id')).status).toBe(400);
  });
});

describe('app-level middleware', () => {
  it('sets security headers via helmet', async () => {
    expect((await request(app).get('/')).headers['x-content-type-options']).toBe('nosniff');
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
