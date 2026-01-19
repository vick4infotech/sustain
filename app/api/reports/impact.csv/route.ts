import { NextResponse } from 'next/server';

import { requireSession, requestContext } from '@/api/auth/session';
import { getImpactSnapshot } from '@/api/reports/impact';
import { toCsv } from '@/lib/csv';
import { recordAuditEvent } from '@/api/audit/audit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await requireSession(['ADMIN', 'DONOR']);

  const snap = getImpactSnapshot();
  const rows = Object.entries(snap).map(([k, v]) => ({ metric: k, value: typeof v === 'number' ? v : String(v) }));
  const csv = toCsv(rows);

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'EXPORT_IMPACT_REPORT',
    entityType: 'REPORT',
    entityId: 'impact.csv',
    metadata: { role: session.user.role },
    ipAddress: ip,
    userAgent,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="impact_${snap.asOf.slice(0, 10)}.csv"`,
    },
  });
}
