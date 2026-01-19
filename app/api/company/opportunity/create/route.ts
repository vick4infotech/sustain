import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { createOpportunity } from '@/api/opportunities/opportunities';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['COMPANY']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const location = String(form.get('location') || '').trim();
  const isRemote = String(form.get('isRemote') || '') === 'on';
  const requirementsText = String(form.get('requirementsText') || '').trim();

  if (!title || !description) {
    return NextResponse.redirect(new URL('/company/opportunities?error=missing', request.url));
  }

  const { opportunityId } = createOpportunity({
    companyUserId: session.user.id,
    title,
    description,
    location,
    isRemote,
    requirementsText,
  });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'CREATE_OPPORTUNITY',
    entityType: 'OPPORTUNITY',
    entityId: opportunityId,
    metadata: { isRemote },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL(`/company/opportunities?created=${opportunityId}`, request.url));
}
