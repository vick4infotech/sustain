import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

function resolveDbPath() {
  const envPath = process.env.DATABASE_PATH;
  const isVercel = process.env.VERCEL === '1';
  if (envPath) {
    return envPath;
  }
  return isVercel ? '/tmp/sustain.db' : '.data/sustain.db';
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const dbPath = resolveDbPath();
ensureDir(dbPath);
const db = new Database(dbPath);

// Ensure foreign keys.
db.pragma('foreign_keys = ON');

// Ensure schema_migrations exists even if first migration isn't applied yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const applied = new Set(
  db
    .prepare('SELECT filename FROM schema_migrations')
    .all()
    .map((r) => r.filename)
);

const insert = db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)');

for (const filename of files) {
  if (applied.has(filename)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
  console.log(`Applying migration: ${filename}`);
  const tx = db.transaction(() => {
    db.exec(sql);
    insert.run(filename);
  });
  tx();
}

console.log('Migrations complete. DB path:', dbPath);
