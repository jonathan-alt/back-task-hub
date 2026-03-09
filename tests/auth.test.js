import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { prisma } from './setup.js'

describe('Auth Routes', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.organizationMember.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('POST /auth/register', () => {
    it('creates a user and returns data without password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Maria', email: 'maria@test.com', password: '123456' })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Maria')
      expect(res.body.email).toBe('maria@test.com')
      expect(res.body.id).toBeDefined()
      expect(res.body.password).toBeUndefined()
    })

    it('rejects duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({ name: 'Maria', email: 'maria@test.com', password: '123456' })

      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Maria 2', email: 'maria@test.com', password: '654321' })

      expect(res.status).toBe(409)
      expect(res.body.error).toBeDefined()
    })

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'maria@test.com' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ name: 'Maria', email: 'maria@test.com', password: '123456' })
    })

    it('returns a valid JWT token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'maria@test.com', password: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.email).toBe('maria@test.com')
      expect(res.body.user.password).toBeUndefined()
    })

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'maria@test.com', password: 'wrong' })

      expect(res.status).toBe(401)
    })

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: '123456' })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    let token

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ name: 'Maria', email: 'maria@test.com', password: '123456' })

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'maria@test.com', password: '123456' })

      token = res.body.token
    })

    it('invalidates the session and returns 204', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(204)
    })

    it('rejects requests with the token after logout', async () => {
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(401)
    })

    it('returns 401 without token', async () => {
      const res = await request(app).post('/auth/logout')
      expect(res.status).toBe(401)
    })
  })
})
