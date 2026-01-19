import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { generateInviteToken } from '@/api/auth/auth';
import { recordAuditEvent } from '@/api/audit/audit';
import { appName } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const userId = Number(form.get('userId') || 0);
  if (!userId) {
    return NextResponse.redirect(new URL('/admin/users?error=bad_request', request.url));
  }

  const { token, expiresAt } = generateInviteToken({ userId, createdByAdminId: session.user.id });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'GENERATE_INVITE',
    entityType: 'USER',
    entityId: userId,
    metadata: { expiresAt },
    ipAddress: ip,
    userAgent,
  });

  const inviteUrl = new URL(`/invite/${token}`, request.url).toString();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appName()} — Invite Link</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 32px; color: #0f172a; }
    .card { max-width: 820px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; }
    code { display: block; padding: 12px; background: #0b1220; color: #e2e8f0; border-radius: 10px; overflow-x: auto; }
    .hint { color: #475569; font-size: 14px; }
    a { color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Invite link created</h1>
    <p class="hint">This link can be used once to set a password. Expires: <strong>${expiresAt}</strong>.</p>
    <p><strong>Copy and send this link securely:</strong></p>
    <code>${inviteUrl}</code>
    <p class="hint">For compliance: avoid sending invite links in public channels. Use approved communication methods.</p>
    <p><a href="/admin/users">Back to user management</a></p>
  </div>
</body>
</html>`;

  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
