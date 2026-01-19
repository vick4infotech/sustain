import 'server-only';

import { getDb } from '@/db/connection';
import type { Role, UserStatus } from '@/api/auth/types';

export type UserRow = {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
};

export function listUsers(limit = 200): UserRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT id, email, role, status, created_at, last_login_at FROM users ORDER BY id DESC LIMIT ?`)
    .all(limit) as UserRow[];
}

export function createUser(params: {
  email: string;
  role: Role;
  status: UserStatus;
  companyName?: string | null;
  fullName?: string | null;
}): { userId: number } {
  const db = getDb();
  const email = params.email.trim().toLowerCase();

  const existing = db.prepare(`SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1`).get(email) as any;
  if (existing) throw new Error('EMAIL_IN_USE');

  const tx = db.transaction(() => {
    const info = db
      .prepare(`INSERT INTO users (email, role, status) VALUES (?, ?, ?)`)
      .run(email, params.role, params.status);

    const userId = Number(info.lastInsertRowid);

    if (params.role === 'TALENT') {
      db.prepare(
        `INSERT INTO talent_profiles (user_id, full_name, profile_visibility, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?)`
      ).run(userId, params.fullName || '', new Date().toISOString(), new Date().toISOString());
    }

    if (params.role === 'COMPANY') {
      db.prepare(
        `INSERT INTO company_profiles (user_id, company_name, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      ).run(userId, params.companyName || '', new Date().toISOString(), new Date().toISOString());
    }

    return { userId };
  });

  return tx();
}

export function updateUserStatus(params: { userId: number; status: UserStatus }) {
  const db = getDb();
  db.prepare(`UPDATE users SET status = ? WHERE id = ?`).run(params.status, params.userId);
}
