import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import * as organizationController from '../controllers/organizationController.js'

const router = Router()

router.use(authenticate)

router.post('/', organizationController.create)
router.post('/join', organizationController.join)
router.get('/', organizationController.listMine)
router.get('/:id/members', organizationController.getMembers)
router.post('/:id/leave', organizationController.leave)
router.delete('/:id', organizationController.remove)

export default router
