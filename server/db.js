import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'database.sqlite');

// Uses Node's built-in SQLite (node:sqlite) — no native compilation needed.
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---- Schema ----------------------------------------------------------------

db.exec(`
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
const settingsCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get();
if (settingsCount.c === 0) {
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insert.run('language', 'ar');
  insert.run('max_single_stock_pct', '20');
  insert.run('max_portfolio_risk_pct', '3');
}

export default db;
