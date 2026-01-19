import fs from 'node:fs';

import { NextResponse } from 'next/server';

import { requireSession } from '@/api/auth/session';
import { getFileAssetById } from '@/api/files/storage';
import { isFileAssetVisibleToTalent } from '@/api/training/training';

export const runtime = 'nodejs';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession(['ADMIN', 'TALENT']);
  const params = await ctx.params;
  const id = Number(params.id || 0);
  if (!id) return new NextResponse('Not found', { status: 404 });

  const asset = getFileAssetById(id);
  if (!asset) return new NextResponse('Not found', { status: 404 });

  if (session.user.role === 'TALENT') {
    const ok = isFileAssetVisibleToTalent({ fileAssetId: id, talentUserId: session.user.id });
    if (!ok) return new NextResponse('Not found', { status: 404 });
  }

  if (!fs.existsSync(asset.storage_path)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const data = fs.readFileSync(asset.storage_path);
  return new NextResponse(data, {
    status: 200,
    headers: {
      'content-type': asset.mime_type || 'application/octet-stream',
      'content-disposition': `inline; filename="${asset.original_name}"`,
      'content-length': String(asset.size_bytes || data.byteLength),
      'cache-control': 'private, max-age=0, no-store',
    },
  });
}
