import 'server-only';

import crypto from 'node:crypto';
import { envString } from './env';

let ephemeralSecret: string | null = null;

function getSessionSecret(): string {
  const configured = envString('SESSION_SECRET');
  if (configured) return configured;

  // Dev fallback: if no SESSION_SECRET is provided, generate an ephemeral secret.
  // This is acceptable for local development only (sessions will reset on restart).
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('base64url');
  }
  return ephemeralSecret;
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hmacSha256Hex(value: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Password hashing (PBKDF2)
//
// We intentionally use Node's built-in crypto to avoid native deps.
// For production hardening, Argon2id is preferred, but PBKDF2 is an accepted industry option
// when configured with high iteration counts.
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  const hash = derived.toString('base64url');
  return `pbkdf2_${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [algo, iterStr, salt, hash] = parts;
  if (!algo.startsWith('pbkdf2_')) return false;
  const digest = algo.replace('pbkdf2_', '');
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 50_000) return false;

  const derived = crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, digest as any);
  const computed = derived.toString('base64url');

  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}
