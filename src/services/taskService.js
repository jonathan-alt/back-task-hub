import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const userSelect = { id: true, name: true }

const taskInclude = {
  author: { select: userSelect },
  assignee: { select: userSelect },
}

async function verifyMembership(userId, organizationId) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  })
  if (!membership) {
    const error = new Error('Você não faz parte desta organização')
    error.status = 403
    throw error
  }
  return membership
}

async function verifyTaskAccess(userId, task) {
  if (task.authorId === userId || task.assigneeId === userId) return

  if (task.organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: task.organizationId },
      },
    })
    if (membership) return
  }

  const error = new Error('Tarefa não encontrada')
  error.status = 404
  throw error
}

export async function create(userId, { title, description, status, deadline, assigneeId, organizationId }) {
  if (!title) {
    const error = new Error('Título é obrigatório')
    error.status = 400
    throw error
  }

  if (organizationId) {
    await verifyMembership(userId, organizationId)

    if (assigneeId && assigneeId !== userId) {
      await verifyMembership(assigneeId, organizationId)
    }
  }

  return prisma.task.create({
    data: {
      title,
      description,
      status: status || 'WAITING',
      deadline: deadline ? new Date(deadline) : null,
      authorId: userId,
      assigneeId: organizationId ? (assigneeId || userId) : userId,
      organizationId: organizationId || null,
    },
    include: taskInclude,
  })
}

export async function list(userId, { status, search, organizationId }) {
  const where = {}

  if (organizationId) {
    await verifyMembership(userId, Number(organizationId))
    where.organizationId = Number(organizationId)
  } else {
    where.organizationId = null
    where.OR = [{ authorId: userId }, { assigneeId: userId }]
  }

  if (status) {
    where.status = status
  }

  if (search) {
    const searchCondition = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchCondition }]
      delete where.OR
    } else {
      where.OR = searchCondition
    }
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getById(userId, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    include: taskInclude,
  })

  if (!task) {
    const error = new Error('Tarefa não encontrada')
    error.status = 404
    throw error
  }

  await verifyTaskAccess(userId, task)

  return task
}

export async function update(userId, taskId, data) {
  const task = await getById(userId, taskId)

  const updateData = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status
  if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null

  if (data.assigneeId !== undefined) {
    if (task.organizationId) {
      await verifyMembership(data.assigneeId, task.organizationId)
    }
    updateData.assigneeId = data.assigneeId
  }

  return prisma.task.update({
    where: { id: task.id },
    data: updateData,
    include: taskInclude,
  })
}

export async function remove(userId, taskId) {
  const task = await getById(userId, taskId)
  return prisma.task.delete({ where: { id: task.id } })
}
