import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { updateUserStatus } from '@/api/users/users';
import { recordAuditEvent } from '@/api/audit/audit';
import type { UserStatus } from '@/api/auth/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const userId = Number(form.get('userId') || 0);
  const status = String(form.get('status') || '').trim() as UserStatus;

  if (!userId || !['active','pending','suspended'].includes(status)) {
    return NextResponse.redirect(new URL('/admin/users?error=bad_request', request.url));
  }

  updateUserStatus({ userId, status });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: status === 'active' ? 'ACTIVATE_USER' : 'SUSPEND_USER',
    entityType: 'USER',
    entityId: userId,
    metadata: { status },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL(`/admin/users?updated=${userId}`, request.url));
}
