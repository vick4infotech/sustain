import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { createUser } from '@/api/users/users';
import { recordAuditEvent } from '@/api/audit/audit';
import type { Role, UserStatus } from '@/api/auth/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const email = String(form.get('email') || '').trim();
  const role = String(form.get('role') || '').trim() as Role;
  const status = String(form.get('status') || 'active').trim() as UserStatus;
  const companyName = String(form.get('companyName') || '').trim();
  const fullName = String(form.get('fullName') || '').trim();

  if (!email || !role) {
    return NextResponse.redirect(new URL('/admin/users?error=missing', request.url));
  }

  if (!['ADMIN','TALENT','COMPANY','DONOR'].includes(role)) {
    return NextResponse.redirect(new URL('/admin/users?error=bad_role', request.url));
  }

  if (!['active','pending','suspended'].includes(status)) {
    return NextResponse.redirect(new URL('/admin/users?error=bad_status', request.url));
  }

  try {
    const { userId } = createUser({ email, role, status, companyName, fullName });

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: userId,
      metadata: { role, status },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.redirect(new URL(`/admin/users?created=${userId}`, request.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/admin/users?error=${encodeURIComponent(e?.message || 'unknown')}`, request.url));
  }
}
