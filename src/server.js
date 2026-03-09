import 'dotenv/config'
import app from './app.js'
import { connectRedis } from './lib/redis.js'

const port = process.env.PORT || 3000

await connectRedis()

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
