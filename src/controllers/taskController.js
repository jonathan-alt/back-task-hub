import * as taskService from '../services/taskService.js'

export async function create(req, res, next) {
  try {
    const task = await taskService.create(req.userId, req.body)
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const tasks = await taskService.list(req.userId, req.query)
    res.json(tasks)
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const task = await taskService.getById(req.userId, req.params.id)
    res.json(task)
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const task = await taskService.update(req.userId, req.params.id, req.body)
    res.json(task)
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await taskService.remove(req.userId, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
