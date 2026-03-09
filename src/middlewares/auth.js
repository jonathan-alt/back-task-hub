import { verifyToken } from '../utils/jwt.js'
import redis from '../lib/redis.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token not provided' })
  }

  const token = header.split(' ')[1]

  try {
    const decoded = verifyToken(token)

    const session = await redis.get(`session:${decoded.jti}`)
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalidated' })
    }

    req.userId = decoded.id
    req.jti = decoded.jti
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
