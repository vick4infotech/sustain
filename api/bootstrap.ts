import 'server-only';

import { getDb } from '@/db/connection';
import { hashPassword } from '@/lib/crypto';
import { envString } from '@/lib/env';
import { recordAuditEvent } from '@/api/audit/audit';

let done = false;

/**
 * Creates an initial admin user if (and only if):
 * 1) No admin user exists yet
 * 2) BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are provided
 *
 * This is a pragmatic MVP pattern for NGO deployments where email sending
 * and SSO are not yet configured.
 */
export function ensureBootstrappedAdmin(): void {
  if (done) return;
  done = true;

  const email = envString('BOOTSTRAP_ADMIN_EMAIL').trim();
  const password = envString('BOOTSTRAP_ADMIN_PASSWORD');
  if (!email || !password) return;

  const db = getDb();
  const existing = db.prepare(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`).get() as any;
  if (existing) return;

  const pwHash = hashPassword(password);
  const info = db.prepare(`INSERT INTO users (email, role, password_hash, status) VALUES (?, 'ADMIN', ?, 'active')`).run(email, pwHash);
  const userId = Number(info.lastInsertRowid);

  recordAuditEvent({
    actorUserId: null,
    action: 'BOOTSTRAP_ADMIN',
    entityType: 'USER',
    entityId: userId,
    metadata: { email }
  });
}
