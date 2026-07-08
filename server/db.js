import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'database.sqlite');

// Uses Node's built-in SQLite (node:sqlite) — no native compilation needed.
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---- Migrations ------------------------------------------------------------
// Each migration has a { version, up(db) }. On boot, every migration whose
// version is greater than the stored schema_version runs, in ascending order,
// inside ONE transaction. This means future column/table changes apply
// automatically to an existing user's database — not only to fresh ones.
//
// To evolve the schema later: append a new migration with the next version and
// an idempotent `up`. Never edit or reorder past migrations.
const migrations = [
  {
    version: 1,
    up(d) {
      d.exec(`
        CREATE TABLE IF NOT EXISTS stocks (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol         TEXT NOT NULL,
          name           TEXT,
          sector         TEXT,
          quantity       REAL NOT NULL DEFAULT 0,
          avg_price      REAL NOT NULL DEFAULT 0,
          current_price  REAL NOT NULL DEFAULT 0,
          target_price   REAL,
          stop_loss      REAL,
          created_at     TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS journal (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol         TEXT,
          name           TEXT,
          decision_type  TEXT NOT NULL DEFAULT 'buy',   -- 'buy' | 'sell'
          identity       TEXT,                          -- 'long_term' | 'swing' | 'scalper'
          checklist      TEXT NOT NULL DEFAULT '{}',    -- full checklist snapshot as JSON
          review         TEXT,                          -- later reflection (nullable)
          created_at     TEXT NOT NULL DEFAULT (datetime('now')),
          reviewed_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          title          TEXT NOT NULL,
          type           TEXT,                          -- 'max_single_stock' | 'diversification' | 'custom'
          target_value   REAL,                          -- e.g. target % or cap %
          current_value  REAL DEFAULT 0,
          note           TEXT,
          created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
          key            TEXT PRIMARY KEY,
          value          TEXT
        );
      `);

      // Seed default settings if empty.
      const count = d.prepare('SELECT COUNT(*) AS c FROM settings').get();
      if (count.c === 0) {
        const insert = d.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        insert.run('language', 'ar');
        insert.run('max_single_stock_pct', '20');
        insert.run('max_portfolio_risk_pct', '3');
      }
    },
  },
];

function runMigrations() {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);');
  let row = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
  if (!row) {
    db.prepare('INSERT INTO schema_version (version) VALUES (0)').run();
    row = { version: 0 };
  }

  let current = row.version;
  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);
  if (pending.length === 0) return;

  db.exec('BEGIN');
  try {
    for (const m of pending) {
      m.up(db);
      current = m.version;
    }
    db.prepare('UPDATE schema_version SET version = ?').run(current);
    db.exec('COMMIT');
    console.log(`  DB migrated to schema version ${current}.`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

runMigrations();

export default db;
