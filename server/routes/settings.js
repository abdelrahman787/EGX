import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/settings — all settings as a flat object.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

// PUT /api/settings — upsert one or more key/value pairs.
router.put('/', (req, res) => {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const entries = Object.entries(req.body || {});
  db.exec('BEGIN');
  try {
    for (const [key, value] of entries) upsert.run(key, String(value));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

export default router;
