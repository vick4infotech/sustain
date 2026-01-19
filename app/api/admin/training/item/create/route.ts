import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { createItem } from '@/api/training/training';
import { saveUploadedFile } from '@/api/files/storage';
import { recordAuditEvent } from '@/api/audit/audit';
import type { TrainingItemType } from '@/api/training/training';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB MVP guardrail

export async function POST(request: Request) {
  const session = await requireSession(['ADMIN']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const moduleId = Number(form.get('moduleId') || 0);
  const type = String(form.get('type') || '').trim() as TrainingItemType;
  const title = String(form.get('title') || '').trim();
  const orderIndex = Number(form.get('orderIndex') || 1000);
  const isPublished = String(form.get('isPublished') || '') === 'on';

  const bodyText = String(form.get('bodyText') || '').trim();
  const contentUrl = String(form.get('contentUrl') || '').trim();

  if (!moduleId || !title || !['LECTURE','VIDEO','DOCUMENT'].includes(type)) {
    return NextResponse.redirect(new URL('/admin/training?error=bad_request', request.url));
  }

  let fileAssetId: number | null = null;

  const maybeFile = form.get('file');
  if (maybeFile && typeof maybeFile === 'object' && 'arrayBuffer' in maybeFile) {
    const f = maybeFile as File;
    if (f.size > MAX_UPLOAD_BYTES) {
      return NextResponse.redirect(new URL(`/admin/training/${moduleId}?error=file_too_large`, request.url));
    }

    const buf = Buffer.from(await f.arrayBuffer());
    const saved = await saveUploadedFile({
      uploadedByUserId: session.user.id,
      originalName: f.name,
      mimeType: f.type,
      buffer: buf,
    });
    fileAssetId = saved.fileAssetId;

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'UPLOAD_FILE',
      entityType: 'FILE_ASSET',
      entityId: fileAssetId,
      metadata: { originalName: f.name, mimeType: f.type, size: f.size },
      ipAddress: ip,
      userAgent,
    });
  }

  const { itemId } = createItem({
    adminUserId: session.user.id,
    moduleId,
    type,
    title,
    bodyText: type === 'LECTURE' ? bodyText : undefined,
    contentUrl: type === 'VIDEO' && !fileAssetId ? contentUrl : undefined,
    fileAssetId,
    orderIndex,
    isPublished,
  });

  const { ip, userAgent } = await requestContext();
  recordAuditEvent({
    actorUserId: session.user.id,
    action: 'CREATE_TRAINING_ITEM',
    entityType: 'TRAINING_ITEM',
    entityId: itemId,
    metadata: { moduleId, type, isPublished, fileAssetId },
    ipAddress: ip,
    userAgent,
  });

  return NextResponse.redirect(new URL(`/admin/training/${moduleId}?createdItem=${itemId}`, request.url));
}
