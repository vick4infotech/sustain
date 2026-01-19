import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { sendMessage } from '@/api/messages/messages';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN', 'TALENT', 'COMPANY']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const recipientUserId = Number(form.get('recipientUserId') || 0);
  const subject = String(form.get('subject') || '').trim();
  const body = String(form.get('body') || '').trim();
  const returnTo = String(form.get('returnTo') || '').trim() || '/messages';

  if (!recipientUserId || !subject || !body) {
    return NextResponse.redirect(new URL(`${returnTo}?error=missing`, request.url));
  }

  try {
    const { messageId } = sendMessage({
      sender: { id: session.user.id, role: session.user.role },
      recipientUserId,
      subject,
      body,
    });

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'SEND_MESSAGE',
      entityType: 'MESSAGE',
      entityId: messageId,
      metadata: { recipientUserId },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.redirect(new URL(`${returnTo}?sent=${messageId}`, request.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`${returnTo}?error=${encodeURIComponent(e?.message || 'unknown')}`, request.url));
  }
}
