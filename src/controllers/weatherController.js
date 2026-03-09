import * as weatherService from '../services/weatherService.js'

export async function getWeather(req, res, next) {
  try {
    const weather = await weatherService.getWeather(req.query.city)
    res.json(weather)
  } catch (err) {
    next(err)
  }
}
