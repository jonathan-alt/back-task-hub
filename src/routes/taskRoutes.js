import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import * as taskController from '../controllers/taskController.js'

const router = Router()

router.use(authenticate)

router.post('/', taskController.create)
router.get('/', taskController.list)
router.get('/:id', taskController.getById)
router.put('/:id', taskController.update)
router.delete('/:id', taskController.remove)

export default router
