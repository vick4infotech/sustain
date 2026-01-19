import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { createModule } from '@/api/training/training';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const isPublished = String(form.get('isPublished') || '') === 'on';

  if (!title) {
    return NextResponse.redirect(new URL('/admin/training?error=missing', request.url));
  }

  const { moduleId } = createModule({ adminUserId: session.user.id, title, description, isPublished });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'CREATE_TRAINING_MODULE',
    entityType: 'TRAINING_MODULE',
    entityId: moduleId,
    metadata: { isPublished },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL(`/admin/training?created=${moduleId}`, request.url));
}
