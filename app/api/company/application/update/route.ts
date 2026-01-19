import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { updateApplicationStatus } from '@/api/opportunities/opportunities';
import { recordAuditEvent } from '@/api/audit/audit';
import type { ApplicationStatus } from '@/api/opportunities/opportunities';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['COMPANY']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const applicationId = Number(form.get('applicationId') || 0);
  const opportunityId = Number(form.get('opportunityId') || 0);
  const newStatus = String(form.get('newStatus') || '').trim() as ApplicationStatus;

  if (!applicationId || !newStatus) {
    return NextResponse.redirect(new URL('/company/opportunities?error=bad_request', request.url));
  }

  try {
    updateApplicationStatus({
      actorRole: 'COMPANY',
      actorCompanyUserId: session.user.id,
      applicationId,
      newStatus,
    });

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'UPDATE_APPLICATION_STATUS',
      entityType: 'APPLICATION',
      entityId: applicationId,
      metadata: { newStatus },
      ipAddress: ip,
      userAgent,
    });

    const back = opportunityId ? `/company/opportunities/${opportunityId}` : '/company/opportunities';
    return NextResponse.redirect(new URL(`${back}?updated=${applicationId}`, request.url));
  } catch (e: any) {
    const back = opportunityId ? `/company/opportunities/${opportunityId}` : '/company/opportunities';
    return NextResponse.redirect(new URL(`${back}?error=${encodeURIComponent(e?.message || 'unknown')}`, request.url));
  }
}
