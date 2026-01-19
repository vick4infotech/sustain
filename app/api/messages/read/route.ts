import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm } from '@/api/auth/session';
import { markMessageRead } from '@/api/messages/messages';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession();
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const messageId = Number(form.get('messageId') || 0);
  const returnTo = String(form.get('returnTo') || '').trim() || '/messages';

  if (messageId) {
    markMessageRead({ recipientUserId: session.user.id, messageId });
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
