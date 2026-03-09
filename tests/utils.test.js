import { describe, it, expect } from 'vitest'
import { generateToken, verifyToken } from '../src/utils/jwt.js'

describe('JWT Utils', () => {
  it('generates a valid token string', () => {
    const token = generateToken({ id: 1 })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifies and decodes a token correctly', () => {
    const token = generateToken({ id: 42 })
    const decoded = verifyToken(token)
    expect(decoded.id).toBe(42)
  })

  it('rejects an invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow()
  })

  it('rejects a tampered token', () => {
    const token = generateToken({ id: 1 })
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyToken(tampered)).toThrow()
  })
})
