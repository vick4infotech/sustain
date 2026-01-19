import { NextResponse } from 'next/server';
import { getDbPathForDiagnostics } from '@/db/connection';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    dbPath: getDbPathForDiagnostics(),
    vercel: process.env.VERCEL === '1',
    node: process.version,
  });
}
