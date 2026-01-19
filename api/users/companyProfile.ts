import 'server-only';

import { getDb } from '@/db/connection';

export type CompanyProfile = {
  userId: number;
  companyName: string;
  sector: string;
  website: string;
  hqLocation: string;
};

export function getCompanyProfile(userId: number): CompanyProfile {
  const db = getDb();
  const p = db
    .prepare(`SELECT user_id, company_name, sector, website, hq_location FROM company_profiles WHERE user_id = ? LIMIT 1`)
    .get(userId) as any;

  if (!p) {
    db.prepare(`INSERT INTO company_profiles (user_id, company_name, created_at, updated_at) VALUES (?, '', ?, ?)`).run(
      userId,
      new Date().toISOString(),
      new Date().toISOString()
    );
    return { userId, companyName: '', sector: '', website: '', hqLocation: '' };
  }

  return {
    userId,
    companyName: p.company_name || '',
    sector: p.sector || '',
    website: p.website || '',
    hqLocation: p.hq_location || '',
  };
}

export function updateCompanyProfile(userId: number, fields: Partial<Omit<CompanyProfile, 'userId'>>) {
  const db = getDb();
  db.prepare(
    `UPDATE company_profiles
     SET company_name = ?, sector = ?, website = ?, hq_location = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(
    (fields.companyName ?? '').trim(),
    (fields.sector ?? '').trim(),
    (fields.website ?? '').trim(),
    (fields.hqLocation ?? '').trim(),
    new Date().toISOString(),
    userId
  );
}
