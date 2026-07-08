import 'dotenv/config';
import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import './db.js'; // initialise schema on boot
import stocksRouter from './routes/stocks.js';
import journalRouter from './routes/journal.js';
import goalsRouter from './routes/goals.js';
import settingsRouter from './routes/settings.js';
import assistantRouter from './routes/assistant.js';
import researchRouter from './routes/research.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// Optional Basic Auth — only active when APP_USERNAME is set in .env.
// Intended for remote deployment (e.g. behind Tailscale). Left unset locally,
// the app runs with no authentication exactly as before.
const APP_USERNAME = process.env.APP_USERNAME;
const APP_PASSWORD = process.env.APP_PASSWORD || '';
if (APP_USERNAME) {
  const safeEqual = (a, b) => {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  };
  app.use((req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization || '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, pass = ''] = Buffer.from(encoded, 'base64').toString().split(':');
      if (safeEqual(user, APP_USERNAME) && safeEqual(pass, APP_PASSWORD)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Thndr Companion"');
    return res.status(401).send('Authentication required');
  });
  console.log('  Basic Auth is ENABLED (APP_USERNAME set).');
}

// API routes
app.use('/api/stocks', stocksRouter);
app.use('/api/journal', journalRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/research', researchRouter);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    assistant_configured:
      !!process.env.NARAROUTER_API_KEY &&
      process.env.NARAROUTER_API_KEY !== 'your_nararouter_api_key_here',
  });
});

// Serve the frontend (static, no build step).
app.use(express.static(join(__dirname, '..', 'public')));

// SPA fallback for client-side routing.
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Thndr Companion running →  http://localhost:${PORT}\n`);
});
