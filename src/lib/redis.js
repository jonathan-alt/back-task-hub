import { createClient } from 'redis'

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

client.on('error', (err) => console.error('Redis client error:', err))

export async function connectRedis() {
  await client.connect()
}

export default client
