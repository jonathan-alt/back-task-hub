import { execSync } from 'child_process'
import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { connectRedis } from '../src/lib/redis.js'
import redis from '../src/lib/redis.js'

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://taskhub:taskhub@localhost:5432/taskhub_test'
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
process.env.JWT_SECRET = 'test-secret'

const prisma = new PrismaClient()

beforeAll(async () => {
  execSync('npx prisma db push --skip-generate --force-reset', {
    env: { ...process.env },
  })
  await connectRedis()
  await redis.flushDb()
})

afterAll(async () => {
  await redis.flushDb()
  await redis.disconnect()
  await prisma.$disconnect()
})

export { prisma }
