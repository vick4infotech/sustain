import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { updateCompanyProfile } from '@/api/users/companyProfile';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['COMPANY']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  updateCompanyProfile(session.user.id, {
    companyName: String(form.get('companyName') || ''),
    sector: String(form.get('sector') || ''),
    website: String(form.get('website') || ''),
    hqLocation: String(form.get('hqLocation') || ''),
  });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'UPDATE_COMPANY_PROFILE',
    entityType: 'USER',
    entityId: session.user.id,
    metadata: { source: 'company_profile_form' },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL('/company/profile?saved=1', request.url));
}
