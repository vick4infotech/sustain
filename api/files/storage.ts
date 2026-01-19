import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { getDb } from '@/db/connection';
import { envString } from '@/lib/env';
import crypto from 'node:crypto';
import { randomToken } from '@/lib/crypto';

function isVercel(): boolean {
  return process.env.VERCEL === '1';
}

export function resolveUploadsDir(): string {
  const configured = envString('UPLOADS_DIR', 'storage/uploads').trim();
  if (isVercel()) {
    // Only /tmp is guaranteed writable on Vercel serverless.
    return '/tmp/uploads';
  }
  return configured;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

export type FileAsset = {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  checksum: string;
  uploaded_by_user_id: number;
  created_at: string;
};

export async function saveUploadedFile(params: {
  uploadedByUserId: number;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileAssetId: number; storagePath: string }> {
  const db = getDb();
  const uploadsDir = resolveUploadsDir();
  ensureDir(uploadsDir);

  const safeName = sanitizeFilename(params.originalName || 'file');
  const key = randomToken(12);
  const storagePath = path.join(uploadsDir, `${key}_${safeName}`);

  fs.writeFileSync(storagePath, params.buffer);
  const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');

  const info = db
    .prepare(
      `INSERT INTO file_assets (original_name, mime_type, size_bytes, storage_path, checksum, uploaded_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      safeName,
      params.mimeType || 'application/octet-stream',
      params.buffer.byteLength,
      storagePath,
      checksum,
      params.uploadedByUserId
    );

  return { fileAssetId: Number(info.lastInsertRowid), storagePath };
}

export function getFileAssetById(id: number): FileAsset | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, original_name, mime_type, size_bytes, storage_path, checksum, uploaded_by_user_id, created_at
       FROM file_assets
       WHERE id = ?`
    )
    .get(id) as any;
  return row || null;
}
