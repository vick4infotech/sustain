import 'server-only';

export function envString(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v === undefined || v === null || String(v).trim() === '') {
    if (fallback !== undefined) return fallback;
    return '';
  }
  return String(v);
}

export function envNumber(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function appName(): string {
  return envString('APP_NAME', 'SUSTAIN Platform');
}
