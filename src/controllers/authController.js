import * as authService from '../services/authService.js'

export async function register(req, res, next) {
  try {
    const user = await authService.register(req.body)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.jti)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
