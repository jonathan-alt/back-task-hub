import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function create(userId, { name, accessKey }) {
  if (!name || !accessKey) {
    const error = new Error('Nome e chave de acesso são obrigatórios')
    error.status = 400
    throw error
  }

  const existing = await prisma.organization.findUnique({ where: { accessKey } })
  if (existing) {
    const error = new Error('Esta chave de acesso já está em uso')
    error.status = 409
    throw error
  }

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name, accessKey },
    })

    await tx.organizationMember.create({
      data: { userId, organizationId: org.id, role: 'OWNER' },
    })

    return org
  })
}

export async function join(userId, accessKey) {
  if (!accessKey) {
    const error = new Error('Chave de acesso é obrigatória')
    error.status = 400
    throw error
  }

  const org = await prisma.organization.findFirst({
    where: { accessKey: { equals: accessKey, mode: 'insensitive' } },
  })

  if (!org) {
    const error = new Error('Organização não encontrada')
    error.status = 404
    throw error
  }

  const alreadyMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
  })

  if (alreadyMember) {
    const error = new Error('Você já faz parte desta organização')
    error.status = 409
    throw error
  }

  await prisma.organizationMember.create({
    data: { userId, organizationId: org.id },
  })

  return org
}

export async function listByUser(userId) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }))
}

export async function getMembers(userId, organizationId) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: Number(organizationId) } },
  })

  if (!membership) {
    const error = new Error('Você não faz parte desta organização')
    error.status = 403
    throw error
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: Number(organizationId) },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return members.map((m) => ({
    ...m.user,
    role: m.role,
  }))
}

export async function leave(userId, organizationId) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: Number(organizationId) } },
  })

  if (!membership) {
    const error = new Error('Você não faz parte desta organização')
    error.status = 404
    throw error
  }

  if (membership.role === 'OWNER') {
    const memberCount = await prisma.organizationMember.count({
      where: { organizationId: Number(organizationId) },
    })

    if (memberCount > 1) {
      const error = new Error('Transfira a propriedade antes de sair')
      error.status = 400
      throw error
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { organizationId: Number(organizationId) } }),
      prisma.organizationMember.delete({ where: { id: membership.id } }),
      prisma.organization.delete({ where: { id: Number(organizationId) } }),
    ])

    return
  }

  await prisma.organizationMember.delete({ where: { id: membership.id } })
}

export async function remove(userId, organizationId) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: Number(organizationId) } },
  })

  if (!membership || membership.role !== 'OWNER') {
    const error = new Error('Apenas o proprietário pode excluir a organização')
    error.status = 403
    throw error
  }

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { organizationId: Number(organizationId) } }),
    prisma.organizationMember.deleteMany({ where: { organizationId: Number(organizationId) } }),
    prisma.organization.delete({ where: { id: Number(organizationId) } }),
  ])
}
