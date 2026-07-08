import { Router } from 'express';
import db from '../db.js';
import { identityConflict } from '../lib/deterministicChecks.js';

const router = Router();

// GET /api/journal — timeline, optional filters ?type= &symbol= &from= &to=
router.get('/', (req, res) => {
  const { type, symbol, from, to } = req.query;
  const clauses = [];
  const params = [];

  if (type) { clauses.push('decision_type = ?'); params.push(type); }
  if (symbol) { clauses.push('symbol = ?'); params.push(String(symbol).toUpperCase()); }
  if (from) { clauses.push("date(created_at) >= date(?)"); params.push(from); }
  if (to) { clauses.push("date(created_at) <= date(?)"); params.push(to); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM journal ${where} ORDER BY created_at DESC`).all(...params);
  res.json(rows.map(parseRow));
});

// GET /api/journal/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM journal WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(parseRow(row));
});

// POST /api/journal — save a decision from the checklist.
router.post('/', (req, res) => {
  const { symbol, name, decision_type = 'buy', identity, checklist = {} } = req.body;

  // Deterministic identity-conflict check against the LAST recorded decision for this symbol.
  let warning = null;
  if (decision_type === 'sell' && symbol) {
    const last = db
      .prepare("SELECT identity FROM journal WHERE symbol = ? AND decision_type = 'buy' ORDER BY created_at DESC LIMIT 1")
      .get(String(symbol).toUpperCase());
    if (last?.identity) {
      const check = identityConflict({
        decisionType: 'sell',
        currentIdentity: identity,
        originalIdentity: last.identity,
      });
      if (check.conflict) warning = check.message;
    }
  }

  const info = db
    .prepare(
      `INSERT INTO journal (symbol, name, decision_type, identity, checklist)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      symbol ? String(symbol).toUpperCase() : null,
      name ?? null,
      decision_type,
      identity ?? null,
      JSON.stringify(checklist)
    );

  const created = parseRow(db.prepare('SELECT * FROM journal WHERE id = ?').get(info.lastInsertRowid));
  res.status(201).json({ entry: created, warning });
});

// PATCH /api/journal/:id/review — add the later reflection.
router.patch('/:id/review', (req, res) => {
  const { review } = req.body;
  const existing = db.prepare('SELECT * FROM journal WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  db.prepare("UPDATE journal SET review = ?, reviewed_at = datetime('now') WHERE id = ?").run(
    review ?? null,
    req.params.id
  );
  res.json(parseRow(db.prepare('SELECT * FROM journal WHERE id = ?').get(req.params.id)));
});

// DELETE /api/journal/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM journal WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

function parseRow(row) {
  let checklist = {};
  try { checklist = JSON.parse(row.checklist); } catch { /* keep empty */ }
  return { ...row, checklist };
}

export default router;
