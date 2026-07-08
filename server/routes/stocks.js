import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/stocks — all portfolio stocks with computed P/L and weight.
router.get('/', (req, res) => {
  const stocks = db.prepare('SELECT * FROM stocks ORDER BY updated_at DESC').all();
  const totalValue = stocks.reduce((sum, s) => sum + s.quantity * s.current_price, 0);

  const enriched = stocks.map((s) => {
    const cost = s.quantity * s.avg_price;
    const value = s.quantity * s.current_price;
    const pl = value - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    const weightPct = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return {
      ...s,
      market_value: Math.round(value * 100) / 100,
      pl: Math.round(pl * 100) / 100,
      pl_pct: Math.round(plPct * 100) / 100,
      weight_pct: Math.round(weightPct * 100) / 100,
    };
  });

  res.json({ stocks: enriched, total_value: Math.round(totalValue * 100) / 100 });
});

// POST /api/stocks — create.
router.post('/', (req, res) => {
  const { symbol, name, sector, quantity, avg_price, current_price, target_price, stop_loss } = req.body;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  const info = db
    .prepare(
      `INSERT INTO stocks (symbol, name, sector, quantity, avg_price, current_price, target_price, stop_loss)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      symbol.trim().toUpperCase(),
      name ?? null,
      sector ?? null,
      Number(quantity) || 0,
      Number(avg_price) || 0,
      Number(current_price) || 0,
      target_price != null && target_price !== '' ? Number(target_price) : null,
      stop_loss != null && stop_loss !== '' ? Number(stop_loss) : null
    );

  const created = db.prepare('SELECT * FROM stocks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/stocks/:id — update (e.g. manual current price refresh).
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const fields = ['symbol', 'name', 'sector', 'quantity', 'avg_price', 'current_price', 'target_price', 'stop_loss'];
  const merged = { ...existing };
  for (const f of fields) {
    if (req.body[f] !== undefined) merged[f] = req.body[f] === '' ? null : req.body[f];
  }

  db.prepare(
    `UPDATE stocks SET symbol=?, name=?, sector=?, quantity=?, avg_price=?, current_price=?,
       target_price=?, stop_loss=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    String(merged.symbol).toUpperCase(),
    merged.name,
    merged.sector,
    Number(merged.quantity) || 0,
    Number(merged.avg_price) || 0,
    Number(merged.current_price) || 0,
    merged.target_price != null ? Number(merged.target_price) : null,
    merged.stop_loss != null ? Number(merged.stop_loss) : null,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM stocks WHERE id = ?').get(req.params.id));
});

// DELETE /api/stocks/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM stocks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
