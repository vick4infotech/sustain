import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || '.data/sustain.db';

if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
  console.log('Deleted DB:', dbPath);
} else {
  console.log('DB not found:', dbPath);
}

const uploads = process.env.UPLOADS_DIR || 'storage/uploads';
if (fs.existsSync(uploads)) {
  fs.rmSync(uploads, { recursive: true, force: true });
  console.log('Deleted uploads:', uploads);
}

const dataDir = path.dirname(dbPath);
if (dataDir && dataDir !== '.' && fs.existsSync(dataDir)) {
  // Keep the directory for convenience.
}
