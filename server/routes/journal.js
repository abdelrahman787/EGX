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
// Optional `portfolio` object triggers a transactional stock update (buy =
// weighted-average, sell = reduce/liquidate) so the frontend never has to make
// several separate calls. Backward compatible: without `portfolio`, only the
// journal row is written.
router.post('/', (req, res) => {
  const { symbol, name, decision_type = 'buy', identity, checklist = {}, portfolio } = req.body;
  const sym = symbol ? String(symbol).toUpperCase() : null;

  // Deterministic identity-conflict check against the LAST recorded buy for this symbol.
  let warning = null;
  if (decision_type === 'sell' && sym) {
    const last = db
      .prepare("SELECT identity FROM journal WHERE symbol = ? AND decision_type = 'buy' ORDER BY created_at DESC LIMIT 1")
      .get(sym);
    if (last?.identity) {
      const check = identityConflict({
        decisionType: 'sell',
        currentIdentity: identity,
        originalIdentity: last.identity,
      });
      if (check.conflict) warning = check.message;
    }
  }

  let created;
  let portfolioResult = null;
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO journal (symbol, name, decision_type, identity, checklist)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(sym, name ?? null, decision_type, identity ?? null, JSON.stringify(checklist));
    created = parseRow(db.prepare('SELECT * FROM journal WHERE id = ?').get(info.lastInsertRowid));

    if (portfolio && portfolio.apply && sym) {
      portfolioResult = applyPortfolioChange(sym, name, decision_type, portfolio);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: String(err?.message || err) });
  }

  res.status(201).json({ entry: created, warning, portfolio: portfolioResult });
});

// Applies a buy (weighted-average) or sell (reduce/liquidate) to the stocks
// table. Must be called INSIDE an open transaction.
function applyPortfolioChange(sym, name, decisionType, p) {
  const num = (v) => (v != null && v !== '' ? Number(v) : null);
  const qty = Number(p.quantity) || 0;
  const existing = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(sym);

  if (decisionType === 'buy') {
    const avg = Number(p.avg_price) || Number(p.current_price) || 0;
    const curr = Number(p.current_price) || avg;
    if (existing) {
      const newQty = existing.quantity + qty;
      const newAvg = newQty > 0
        ? ((existing.quantity * existing.avg_price) + (qty * avg)) / newQty
        : existing.avg_price;
      db.prepare(
        `UPDATE stocks SET name=?, sector=?, quantity=?, avg_price=?, current_price=?,
           target_price=?, stop_loss=?, updated_at=datetime('now') WHERE id=?`
      ).run(
        name ?? existing.name,
        p.sector || existing.sector,
        newQty,
        newAvg,
        curr,
        num(p.target_price) ?? existing.target_price,
        num(p.stop_loss) ?? existing.stop_loss,
        existing.id
      );
      return { action: 'buy_averaged', quantity: newQty, avg_price: Math.round(newAvg * 100) / 100 };
    }
    db.prepare(
      `INSERT INTO stocks (symbol, name, sector, quantity, avg_price, current_price, target_price, stop_loss)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(sym, name ?? null, p.sector ?? null, qty, avg, curr, num(p.target_price), num(p.stop_loss));
    return { action: 'buy_new', quantity: qty, avg_price: avg };
  }

  if (decisionType === 'sell') {
    if (!existing) return { action: 'sell_no_position' };
    // No quantity, or selling the whole position → full liquidation.
    if (!qty || qty >= existing.quantity) {
      db.prepare('DELETE FROM stocks WHERE id = ?').run(existing.id);
      return { action: 'sell_liquidated', quantity: existing.quantity };
    }
    const newQty = existing.quantity - qty;
    db.prepare("UPDATE stocks SET quantity=?, updated_at=datetime('now') WHERE id=?").run(newQty, existing.id);
    return { action: 'sell_reduced', quantity: newQty, avg_price: existing.avg_price };
  }

  return null;
}

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
