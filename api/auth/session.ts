import 'server-only';

import { cookies as nextCookies, headers as nextHeaders } from 'next/headers';
import { getDb } from '@/db/connection';
import { envNumber, envString, isProd } from '@/lib/env';
import { hmacSha256Hex, randomToken } from '@/lib/crypto';
import type { Role, Session, SessionUser } from './types';

export function sessionCookieName(): string {
  return envString('SESSION_COOKIE_NAME', 'sid');
}

export function sessionTtlHours(): number {
  return envNumber('SESSION_TTL_HOURS', 168); // 7 days
}

function nowIso(): string {
  return new Date().toISOString();
}

function addHoursIso(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export async function createSession(user: SessionUser): Promise<{ sessionId: string; csrfToken: string; expiresAt: string }> {
  const db = getDb();
  const sessionId = randomToken(32);
  const sessionHash = hmacSha256Hex(sessionId);
  const csrfToken = randomToken(24);
  const expiresAt = addHoursIso(sessionTtlHours());

  db.prepare(
    `INSERT INTO sessions (session_hash, user_id, csrf_token, expires_at)
     VALUES (?, ?, ?, ?)`
  ).run(sessionHash, user.id, csrfToken, expiresAt);

  return { sessionId, csrfToken, expiresAt };
}

export async function destroySessionByCookie(): Promise<void> {
  const cookieStore = await nextCookies();
  const sid = cookieStore.get(sessionCookieName())?.value;
  if (!sid) return;
  const db = getDb();
  const sessionHash = hmacSha256Hex(sid);
  db.prepare(`UPDATE sessions SET revoked_at = ? WHERE session_hash = ?`).run(nowIso(), sessionHash);
}

export async function clearSessionCookie(response: any) {
  response.cookies.set({
    name: sessionCookieName(),
    value: '',
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function setSessionCookie(response: any, sid: string, expiresAt: string) {
  const maxAgeSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  response.cookies.set({
    name: sessionCookieName(),
    value: sid,
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function getSession(): Promise<Session | null> {
  const db = getDb();
  const cookieStore = await nextCookies();
  const sid = cookieStore.get(sessionCookieName())?.value;
  if (!sid) return null;

  const sessionHash = hmacSha256Hex(sid);

  const row = db
    .prepare(
      `SELECT s.csrf_token, s.expires_at, s.revoked_at,
              u.id as user_id, u.email, u.role, u.status
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_hash = ?
       LIMIT 1`
    )
    .get(sessionHash) as any;

  if (!row) return null;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  // Touch last_seen_at (best-effort).
  db.prepare(`UPDATE sessions SET last_seen_at = ? WHERE session_hash = ?`).run(nowIso(), sessionHash);

  return {
    user: {
      id: row.user_id,
      email: row.email,
      role: row.role,
      status: row.status,
    },
    csrfToken: row.csrf_token,
    expiresAt: row.expires_at,
  };
}

/**
 * Like requireSession, but does not enforce `user.status === 'active'`.
 * This is used for the `/pending` page and logout flows.
 */
export async function requireAnySession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export async function requireSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  if (session.user.status !== 'active') {
    throw new Error('ACCOUNT_INACTIVE');
  }
  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export async function requireCsrfTokenFromForm(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');

  const token = String(formData.get('csrfToken') || '');
  if (!token || token !== session.csrfToken) {
    throw new Error('BAD_CSRF');
  }
}

export async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await nextHeaders();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const userAgent = h.get('user-agent') || null;
  return { ip, userAgent };
}
