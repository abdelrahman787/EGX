import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import './db.js'; // initialise schema on boot
import stocksRouter from './routes/stocks.js';
import journalRouter from './routes/journal.js';
import goalsRouter from './routes/goals.js';
import settingsRouter from './routes/settings.js';
import assistantRouter from './routes/assistant.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api/stocks', stocksRouter);
app.use('/api/journal', journalRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/assistant', assistantRouter);

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
