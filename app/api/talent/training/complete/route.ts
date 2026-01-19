import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { markItemComplete } from '@/api/training/training';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['TALENT']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const moduleId = Number(form.get('moduleId') || 0);
  const itemId = Number(form.get('itemId') || 0);
  if (!moduleId || !itemId) {
    return NextResponse.redirect(new URL('/talent/learning?error=bad_request', request.url));
  }

  markItemComplete({ talentUserId: session.user.id, trainingItemId: itemId });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'MARK_ITEM_COMPLETE',
    entityType: 'TRAINING_ITEM',
    entityId: itemId,
    metadata: { moduleId },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL(`/talent/learning/${moduleId}?completed=${itemId}`, request.url));
}
