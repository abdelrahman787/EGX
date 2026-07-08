import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/export — full snapshot of all data as a single JSON object.
router.get('/export', (req, res) => {
  const stocks = db.prepare('SELECT * FROM stocks').all();
  const journal = db.prepare('SELECT * FROM journal').all(); // checklist kept as stored (string)
  const goals = db.prepare('SELECT * FROM goals').all();
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  res.json({
    app: 'thndr-companion',
    version: 1,
    exported_at: new Date().toISOString(),
    stocks,
    journal,
    goals,
    settings,
  });
});

// POST /api/import — FULL REPLACE of all data with the provided snapshot.
// Runs inside a single transaction; rolls back on any error.
router.post('/import', (req, res) => {
  const body = req.body || {};
  const stocks = Array.isArray(body.stocks) ? body.stocks : [];
  const journal = Array.isArray(body.journal) ? body.journal : [];
  const goals = Array.isArray(body.goals) ? body.goals : [];
  const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};

  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM stocks; DELETE FROM journal; DELETE FROM goals; DELETE FROM settings;');

    const insStock = db.prepare(
      `INSERT INTO stocks (symbol, name, sector, quantity, avg_price, current_price, target_price, stop_loss, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const s of stocks) {
      insStock.run(
        String(s.symbol || '').toUpperCase(),
        s.name ?? null, s.sector ?? null,
        Number(s.quantity) || 0, Number(s.avg_price) || 0, Number(s.current_price) || 0,
        s.target_price != null && s.target_price !== '' ? Number(s.target_price) : null,
        s.stop_loss != null && s.stop_loss !== '' ? Number(s.stop_loss) : null,
        s.created_at || now(), s.updated_at || now()
      );
    }

    const insJournal = db.prepare(
      `INSERT INTO journal (symbol, name, decision_type, identity, checklist, review, created_at, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const j of journal) {
      const checklist = typeof j.checklist === 'string' ? j.checklist : JSON.stringify(j.checklist ?? {});
      insJournal.run(
        j.symbol ? String(j.symbol).toUpperCase() : null,
        j.name ?? null,
        j.decision_type || 'buy',
        j.identity ?? null,
        checklist,
        j.review ?? null,
        j.created_at || now(),
        j.reviewed_at ?? null
      );
    }

    const insGoal = db.prepare(
      `INSERT INTO goals (title, type, target_value, current_value, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const g of goals) {
      insGoal.run(
        g.title || '(untitled)', g.type ?? 'custom',
        g.target_value != null && g.target_value !== '' ? Number(g.target_value) : null,
        Number(g.current_value) || 0, g.note ?? null, g.created_at || now()
      );
    }

    const insSetting = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    );
    for (const [key, value] of Object.entries(settings)) insSetting.run(key, String(value));

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(400).json({
      error: {
        ar: 'فشل الاستيراد — تم التراجع عن كل التغييرات. تأكد من صحة ملف النسخة الاحتياطية.',
        en: 'Import failed — all changes were rolled back. Check that the backup file is valid.',
      },
      detail: String(err?.message || err),
    });
  }

  res.json({
    ok: true,
    counts: { stocks: stocks.length, journal: journal.length, goals: goals.length, settings: Object.keys(settings).length },
  });
});

export default router;
