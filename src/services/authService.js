import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { generateToken, verifyToken } from '../utils/jwt.js'
import redis from '../lib/redis.js'

const prisma = new PrismaClient()

export async function register({ name, email, password }) {
  if (!name || !email || !password) {
    const error = new Error('Nome, email e senha são obrigatórios')
    error.status = 400
    throw error
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const error = new Error('Este email já está em uso')
    error.status = 409
    throw error
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name, email, password: hash },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  return user
}

export async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email e senha são obrigatórios')
    error.status = 400
    throw error
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const error = new Error('Email ou senha inválidos')
    error.status = 401
    throw error
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    const error = new Error('Email ou senha inválidos')
    error.status = 401
    throw error
  }

  const token = generateToken({ id: user.id })
  const decoded = verifyToken(token)
  const ttl = decoded.exp - Math.floor(Date.now() / 1000)

  await redis.set(`session:${decoded.jti}`, user.id, { EX: ttl })

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  }
}

export async function logout(jti) {
  await redis.del(`session:${jti}`)
}
