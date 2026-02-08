import { handle } from '@hono/node-server/vercel'
import { app } from '../backend/src/index'

export default handle(app)
