import { NextResponse } from 'next/server';

import { destroySessionByCookie, clearSessionCookie, requireCsrfTokenFromForm, getSession, requestContext } from '@/api/auth/session';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    await requireCsrfTokenFromForm(form);
  } catch {
    // If CSRF validation fails, we still allow logout (defensive) but do not disclose details.
  }

  const session = await getSession();
  await destroySessionByCookie();

  const res = NextResponse.redirect(new URL('/login', request.url));
  await clearSessionCookie(res);

  if (session) {
    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'LOGOUT',
      entityType: 'SESSION',
      entityId: null,
      ipAddress: ip,
      userAgent,
    });
  }

  return res;
}
