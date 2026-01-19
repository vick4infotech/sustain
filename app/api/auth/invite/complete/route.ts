import { NextResponse } from 'next/server';

import { completeInvite } from '@/api/auth/auth';
import { createSession, setSessionCookie } from '@/api/auth/session';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get('token') || '');
  const password = String(form.get('password') || '');

  if (!token || !password) {
    return NextResponse.redirect(new URL(`/invite/${encodeURIComponent(token)}?error=missing`, request.url));
  }

  try {
    const { user } = completeInvite({ token, newPassword: password });
    const { sessionId, expiresAt } = await createSession(user);

    const res = NextResponse.redirect(new URL('/', request.url));
    await setSessionCookie(res, sessionId, expiresAt);

    recordAuditEvent({
      actorUserId: user.id,
      action: 'SET_PASSWORD_FROM_INVITE',
      entityType: 'USER',
      entityId: user.id,
      metadata: { role: user.role },
    });

    return res;
  } catch (e: any) {
    const code = e?.message || 'unknown';
    return NextResponse.redirect(new URL(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(code)}`, request.url));
  }
}
