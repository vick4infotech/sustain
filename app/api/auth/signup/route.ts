import { NextResponse } from 'next/server';

import { createTalentSignup } from '@/api/auth/auth';
import { createSession, setSessionCookie } from '@/api/auth/session';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim();
  const fullName = String(form.get('fullName') || '').trim();
  const password = String(form.get('password') || '');
  const accessCode = String(form.get('accessCode') || '');

  if (!email || !password || !fullName) {
    return NextResponse.redirect(new URL('/signup?error=missing', request.url));
  }

  try {
    const { user } = createTalentSignup({ email, password, fullName, accessCode });

    const { sessionId, expiresAt } = await createSession(user);
    const res = NextResponse.redirect(new URL('/pending', request.url));
    await setSessionCookie(res, sessionId, expiresAt);

    recordAuditEvent({
      actorUserId: user.id,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: user.id,
      metadata: { role: 'TALENT', source: 'self_signup' },
    });

    return res;
  } catch (e: any) {
    const code = e?.message || 'unknown';
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(code)}`, request.url));
  }
}
