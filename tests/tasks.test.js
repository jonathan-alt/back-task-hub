import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { prisma } from './setup.js'

async function createUserAndGetToken(name, email, password) {
  await request(app)
    .post('/auth/register')
    .send({ name, email, password })

  const res = await request(app)
    .post('/auth/login')
    .send({ email, password })

  return res.body.token
}

describe('Task Routes', () => {
  let token

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
    token = await createUserAndGetToken('Maria', 'maria@test.com', '123456')
  })

  describe('POST /tasks', () => {
    it('creates a task for the authenticated user', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Study Express', description: 'Learn middlewares' })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('Study Express')
      expect(res.body.status).toBe('WAITING')
      expect(res.body.author).toBeDefined()
      expect(res.body.assignee).toBeDefined()
    })

    it('rejects creation without title', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /tasks', () => {
    beforeEach(async () => {
      await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1', description: 'First' })

      await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 2', description: 'Second' })
    })

    it('lists only tasks from the authenticated user', async () => {
      const token2 = await createUserAndGetToken('João', 'joao@test.com', '123456')

      const res1 = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`)

      const res2 = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${token2}`)

      expect(res1.status).toBe(200)
      expect(res1.body).toHaveLength(2)
      expect(res2.body).toHaveLength(0)
    })

    it('filters by status', async () => {
      const tasks = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`)

      await request(app)
        .put(`/tasks/${tasks.body[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'DONE' })

      const done = await request(app)
        .get('/tasks?status=DONE')
        .set('Authorization', `Bearer ${token}`)

      const waiting = await request(app)
        .get('/tasks?status=WAITING')
        .set('Authorization', `Bearer ${token}`)

      expect(done.body).toHaveLength(1)
      expect(waiting.body).toHaveLength(1)
    })

    it('filters by search keyword', async () => {
      const res = await request(app)
        .get('/tasks?search=First')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body).toHaveLength(1)
      expect(res.body[0].description).toBe('First')
    })
  })

  describe('GET /tasks/:id', () => {
    it('returns a task belonging to the user', async () => {
      const created = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My task' })

      const res = await request(app)
        .get(`/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('My task')
    })

    it('returns 404 for another user task', async () => {
      const created = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Private task' })

      const token2 = await createUserAndGetToken('João', 'joao@test.com', '123456')

      const res = await request(app)
        .get(`/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token2}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /tasks/:id', () => {
    it('updates a task', async () => {
      const created = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Original' })

      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', status: 'IN_PROGRESS' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated')
      expect(res.body.status).toBe('IN_PROGRESS')
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('removes a task', async () => {
      const created = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'To delete' })

      const res = await request(app)
        .delete(`/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)

      const check = await request(app)
        .get(`/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(check.status).toBe(404)
    })
  })

  describe('Auth guard', () => {
    it('returns 401 without token on all routes', async () => {
      const routes = [
        { method: 'get', path: '/tasks' },
        { method: 'post', path: '/tasks' },
        { method: 'get', path: '/tasks/1' },
        { method: 'put', path: '/tasks/1' },
        { method: 'delete', path: '/tasks/1' },
      ]

      for (const route of routes) {
        const res = await request(app)[route.method](route.path)
        expect(res.status).toBe(401)
      }
    })
  })
})
