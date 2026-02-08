import { handle } from '@hono/node-server/vercel';
import { app } from '../backend/dist/index.js';

export default handle(app);
