import express from 'express'
import cors from 'cors'
import { errorHandler } from './middlewares/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import organizationRoutes from './routes/organizationRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/tasks', taskRoutes)
app.use('/organizations', organizationRoutes)
app.use('/weather', weatherRoutes)

app.use(errorHandler)

export default app
