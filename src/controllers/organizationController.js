import * as organizationService from '../services/organizationService.js'

export async function create(req, res, next) {
  try {
    const org = await organizationService.create(req.userId, req.body)
    res.status(201).json(org)
  } catch (err) {
    next(err)
  }
}

export async function join(req, res, next) {
  try {
    const org = await organizationService.join(req.userId, req.body.accessKey)
    res.json(org)
  } catch (err) {
    next(err)
  }
}

export async function listMine(req, res, next) {
  try {
    const orgs = await organizationService.listByUser(req.userId)
    res.json(orgs)
  } catch (err) {
    next(err)
  }
}

export async function getMembers(req, res, next) {
  try {
    const members = await organizationService.getMembers(req.userId, req.params.id)
    res.json(members)
  } catch (err) {
    next(err)
  }
}

export async function leave(req, res, next) {
  try {
    await organizationService.leave(req.userId, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await organizationService.remove(req.userId, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
