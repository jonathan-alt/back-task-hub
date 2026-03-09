import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const secret = process.env.JWT_SECRET

export function generateToken(payload) {
  return jwt.sign({ ...payload, jti: randomUUID() }, secret, { expiresIn: '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, secret)
}
