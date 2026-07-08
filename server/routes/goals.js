import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all());
});

router.post('/', (req, res) => {
  const { title, type, target_value, current_value, note } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const info = db
    .prepare('INSERT INTO goals (title, type, target_value, current_value, note) VALUES (?, ?, ?, ?, ?)')
    .run(
      title,
      type ?? 'custom',
      target_value != null && target_value !== '' ? Number(target_value) : null,
      current_value != null && current_value !== '' ? Number(current_value) : 0,
      note ?? null
    );
  res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { title, type, target_value, current_value, note } = { ...existing, ...req.body };
  db.prepare('UPDATE goals SET title=?, type=?, target_value=?, current_value=?, note=? WHERE id=?').run(
    title, type,
    target_value != null && target_value !== '' ? Number(target_value) : null,
    current_value != null && current_value !== '' ? Number(current_value) : 0,
    note, req.params.id
  );
  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
