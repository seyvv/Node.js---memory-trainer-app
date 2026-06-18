import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

import { pagesRouter } from './routes/pages.js';

export const app = new Hono();

app.use('/public/*', serveStatic({ root: './' }));

app.route('/', pagesRouter);