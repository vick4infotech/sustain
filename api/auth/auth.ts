import 'server-only';

import { getDb } from '@/db/connection';
import { hashPassword, randomToken, sha256Hex, verifyPassword } from '@/lib/crypto';
import { envString } from '@/lib/env';
import type { Role, SessionUser } from './types';

const INVITE_TTL_HOURS = 72;

function addHoursIso(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function findUserByEmail(email: string): SessionUser | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, email, role, status FROM users WHERE lower(email) = lower(?) LIMIT 1`)
    .get(email) as any;
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, status: row.status };
}

export function authenticate(email: string, password: string): SessionUser | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, email, role, status, password_hash FROM users WHERE lower(email) = lower(?) LIMIT 1`)
    .get(email) as any;
  if (!row) return null;
  if (!row.password_hash) return null;
  if (!verifyPassword(password, row.password_hash)) return null;

  db.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`).run(new Date().toISOString(), row.id);

  return { id: row.id, email: row.email, role: row.role, status: row.status };
}

export function createTalentSignup(params: {
  email: string;
  password: string;
  fullName: string;
  accessCode?: string;
}): { user: SessionUser } {
  const requiredCode = envString('PROGRAMME_ACCESS_CODE');
  if (requiredCode && requiredCode.trim()) {
    if (!params.accessCode || params.accessCode.trim() !== requiredCode.trim()) {
      throw new Error('BAD_ACCESS_CODE');
    }
  }

  const db = getDb();

  const existing = findUserByEmail(params.email);
  if (existing) throw new Error('EMAIL_IN_USE');

  const pwHash = hashPassword(params.password);

  const tx = db.transaction(() => {
    const info = db
      .prepare(`INSERT INTO users (email, role, password_hash, status) VALUES (?, 'TALENT', ?, 'pending')`)
      .run(params.email.trim(), pwHash);

    const userId = Number(info.lastInsertRowid);
    db.prepare(
      `INSERT INTO talent_profiles (user_id, full_name, profile_visibility, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?)`
    ).run(userId, params.fullName.trim(), new Date().toISOString(), new Date().toISOString());

    return { userId };
  });

  const { userId } = tx();

  return {
    user: {
      id: userId,
      email: params.email,
      role: 'TALENT',
      status: 'pending',
    },
  };
}

export function generateInviteToken(params: {
  userId: number;
  createdByAdminId: number;
}): { token: string; expiresAt: string } {
  const db = getDb();
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = addHoursIso(INVITE_TTL_HOURS);

  // Revoke any existing unused invites for this user.
  db.prepare(
    `UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND type = 'INVITE' AND used_at IS NULL`
  ).run(new Date().toISOString(), params.userId);

  db.prepare(
    `INSERT INTO auth_tokens (token_hash, user_id, type, expires_at)
     VALUES (?, ?, 'INVITE', ?)`
  ).run(tokenHash, params.userId, expiresAt);

  return { token, expiresAt };
}

export function completeInvite(params: {
  token: string;
  newPassword: string;
}): { user: SessionUser } {
  const db = getDb();
  const tokenHash = sha256Hex(params.token);

  const row = db
    .prepare(
      `SELECT t.id as token_id, t.user_id, t.expires_at, t.used_at,
              u.id as user_id, u.email, u.role, u.status
       FROM auth_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.type = 'INVITE'
       LIMIT 1`
    )
    .get(tokenHash) as any;

  if (!row) throw new Error('BAD_OR_EXPIRED_INVITE');
  if (row.used_at) throw new Error('INVITE_ALREADY_USED');
  if (new Date(row.expires_at).getTime() <= Date.now()) throw new Error('INVITE_EXPIRED');

  const pwHash = hashPassword(params.newPassword);

  const tx = db.transaction(() => {
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(pwHash, row.user_id);
    db.prepare(`UPDATE auth_tokens SET used_at = ? WHERE id = ?`).run(new Date().toISOString(), row.token_id);
  });

  tx();

  return {
    user: {
      id: row.user_id,
      email: row.email,
      role: row.role as Role,
      status: row.status,
    },
  };
}

export function peekInvite(params: { token: string }): { userEmail: string; role: Role; expiresAt: string } | null {
  const db = getDb();
  const tokenHash = sha256Hex(params.token);
  const row = db
    .prepare(
      `SELECT t.expires_at, u.email, u.role
       FROM auth_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.type = 'INVITE' AND t.used_at IS NULL
       LIMIT 1`
    )
    .get(tokenHash) as any;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return { userEmail: row.email, role: row.role as Role, expiresAt: row.expires_at };
}
