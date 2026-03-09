import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authenticate, authController.logout)

export default router
