import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import * as weatherController from '../controllers/weatherController.js'

const router = Router()

router.use(authenticate)

router.get('/', weatherController.getWeather)

export default router
