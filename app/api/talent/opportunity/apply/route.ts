import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { applyToOpportunity } from '@/api/opportunities/opportunities';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['TALENT']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const opportunityId = Number(form.get('opportunityId') || 0);
  if (!opportunityId) {
    return NextResponse.redirect(new URL('/talent/opportunities?error=bad_request', request.url));
  }

  try {
    const { applicationId } = applyToOpportunity({ talentUserId: session.user.id, opportunityId });

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'APPLY_OPPORTUNITY',
      entityType: 'APPLICATION',
      entityId: applicationId,
      metadata: { opportunityId },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.redirect(new URL(`/talent/applications?applied=${applicationId}`, request.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/talent/opportunities?error=${encodeURIComponent(e?.message || 'unknown')}`, request.url));
  }
}
