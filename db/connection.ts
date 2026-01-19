import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

let dbSingleton: Database.Database | null = null;
let initialized = false;

function resolveDbPath(): string {
  const envPath = process.env.DATABASE_PATH;
  const isVercel = process.env.VERCEL === '1';
  if (envPath && envPath.trim()) return envPath;
  return isVercel ? '/tmp/sustain.db' : '.data/sustain.db';
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getMigrations(): { filename: string; sql: string }[] {
  const dir = path.join(process.cwd(), 'db', 'migrations');
  if (!fs.existsSync(dir)) {
    throw new Error(`Migrations directory not found: ${dir}`);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  return files.map((filename) => ({
    filename,
    sql: fs.readFileSync(path.join(dir, filename), 'utf8'),
  }));
}

function initDb(db: Database.Database) {
  if (initialized) return;

  db.pragma('foreign_keys = ON');

  // Ensure schema_migrations exists before applying migration files.
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set<string>(
    db
      .prepare('SELECT filename FROM schema_migrations')
      .all()
      .map((r: any) => r.filename)
  );

  const insert = db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)');
  const migrations = getMigrations();

  const tx = db.transaction(() => {
    for (const m of migrations) {
      if (applied.has(m.filename)) continue;
      db.exec(m.sql);
      insert.run(m.filename);
    }
  });

  tx();
  initialized = true;
}

export function getDb(): Database.Database {
  if (dbSingleton) {
    initDb(dbSingleton);
    return dbSingleton;
  }

  const dbPath = resolveDbPath();
  ensureDir(dbPath);

  dbSingleton = new Database(dbPath);
  initDb(dbSingleton);
  return dbSingleton;
}

export function getDbPathForDiagnostics(): string {
  return resolveDbPath();
}
