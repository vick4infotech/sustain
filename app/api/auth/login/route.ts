import { NextResponse } from 'next/server';

import { ensureBootstrappedAdmin } from '@/api/bootstrap';
import { authenticate } from '@/api/auth/auth';
import { createSession, setSessionCookie, requestContext } from '@/api/auth/session';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  ensureBootstrappedAdmin();

  const form = await request.formData();
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=missing', request.url));
  }

  const user = authenticate(email, password);
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url));
  }

  const { sessionId, expiresAt } = await createSession(user);
  const res = NextResponse.redirect(new URL(user.status === 'active' ? '/' : '/pending', request.url));
  await setSessionCookie(res, sessionId, expiresAt);

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'SESSION',
    entityId: null,
    metadata: { email: user.email },
    ipAddress: ip,
    userAgent,
  });

  return res;
}
