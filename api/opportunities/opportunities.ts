import 'server-only';

import { getDb } from '@/db/connection';

export type OpportunityStatus = 'open' | 'closed';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export type OpportunityRow = {
  id: number;
  company_user_id: number;
  title: string;
  description: string;
  location: string;
  is_remote: number;
  requirements_text: string;
  status: OpportunityStatus;
  created_at: string;
};

export type AdminOpportunityRow = OpportunityRow & {
  company_email: string;
  company_name: string | null;
  application_count: number;
  hired_count: number;
};

export function getCompanyHiringSummary(companyUserId: number): {
  opportunitiesOpen: number;
  opportunitiesTotal: number;
  applicationsTotal: number;
  hires: number;
} {
  const db = getDb();

  const opportunitiesTotal = Number((db.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE company_user_id = ?`).get(companyUserId) as any).c);
  const opportunitiesOpen = Number((db.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE company_user_id = ? AND status = 'open'`).get(companyUserId) as any).c);
  const applicationsTotal = Number(
    (db
      .prepare(
        `SELECT COUNT(*) as c
         FROM applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         WHERE o.company_user_id = ?`
      )
      .get(companyUserId) as any).c
  );
  const hires = Number(
    (db
      .prepare(
        `SELECT COUNT(*) as c
         FROM applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         WHERE o.company_user_id = ? AND a.status = 'hired'`
      )
      .get(companyUserId) as any).c
  );

  return { opportunitiesOpen, opportunitiesTotal, applicationsTotal, hires };
}

export function listAllOpportunitiesForAdmin(limit = 200): AdminOpportunityRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT o.*, u.email as company_email, cp.company_name as company_name,
              (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id) as application_count,
              (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id AND a.status = 'hired') as hired_count
       FROM opportunities o
       JOIN users u ON u.id = o.company_user_id
       LEFT JOIN company_profiles cp ON cp.user_id = o.company_user_id
       ORDER BY o.created_at DESC
       LIMIT ?`
    )
    .all(limit) as any;
}

export type ApplicationRow = {
  id: number;
  opportunity_id: number;
  talent_user_id: number;
  status: ApplicationStatus;
  applied_at: string;
  status_updated_at: string;
  hired_at: string | null;
};

export function createOpportunity(params: {
  companyUserId: number;
  title: string;
  description: string;
  location: string;
  isRemote: boolean;
  requirementsText: string;
}): { opportunityId: number } {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO opportunities (company_user_id, title, description, location, is_remote, requirements_text, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
    )
    .run(
      params.companyUserId,
      params.title.trim(),
      params.description.trim(),
      params.location.trim(),
      params.isRemote ? 1 : 0,
      params.requirementsText.trim(),
      now,
      now
    );
  return { opportunityId: Number(info.lastInsertRowid) };
}

export function listCompanyOpportunities(companyUserId: number): OpportunityRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, company_user_id, title, description, location, is_remote, requirements_text, status, created_at
       FROM opportunities
       WHERE company_user_id = ?
       ORDER BY id DESC`
    )
    .all(companyUserId) as OpportunityRow[];
}

export function getCompanyOpportunity(params: { companyUserId: number; opportunityId: number }): OpportunityRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, company_user_id, title, description, location, is_remote, requirements_text, status, created_at
       FROM opportunities
       WHERE id = ? AND company_user_id = ?
       LIMIT 1`
    )
    .get(params.opportunityId, params.companyUserId) as any;
  return row || null;
}

export function listOpenOpportunitiesForTalent(limit = 200): OpportunityRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, company_user_id, title, description, location, is_remote, requirements_text, status, created_at
       FROM opportunities
       WHERE status = 'open'
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(limit) as OpportunityRow[];
}

export function applyToOpportunity(params: { talentUserId: number; opportunityId: number }): { applicationId: number } {
  const db = getDb();

  const existing = db
    .prepare(
      `SELECT id FROM applications WHERE opportunity_id = ? AND talent_user_id = ? LIMIT 1`
    )
    .get(params.opportunityId, params.talentUserId) as any;
  if (existing) throw new Error('ALREADY_APPLIED');

  const info = db
    .prepare(
      `INSERT INTO applications (opportunity_id, talent_user_id, status, applied_at, status_updated_at)
       VALUES (?, ?, 'applied', ?, ?)`
    )
    .run(params.opportunityId, params.talentUserId, new Date().toISOString(), new Date().toISOString());

  return { applicationId: Number(info.lastInsertRowid) };
}

export function listTalentApplications(talentUserId: number): Array<ApplicationRow & { opportunity_title: string }> {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.id, a.opportunity_id, a.talent_user_id, a.status, a.applied_at, a.status_updated_at, a.hired_at,
              o.title as opportunity_title
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.talent_user_id = ?
       ORDER BY a.id DESC`
    )
    .all(talentUserId) as any;
}

export function listOpportunityApplicationsForCompany(params: {
  companyUserId: number;
  opportunityId: number;
}): Array<ApplicationRow & { talent_display_name: string }> {
  const db = getDb();

  // Ensure company owns the opportunity.
  const owns = db
    .prepare(`SELECT id FROM opportunities WHERE id = ? AND company_user_id = ? LIMIT 1`)
    .get(params.opportunityId, params.companyUserId) as any;
  if (!owns) throw new Error('FORBIDDEN');

  return db
    .prepare(
      `SELECT a.id, a.opportunity_id, a.talent_user_id, a.status, a.applied_at, a.status_updated_at, a.hired_at,
              p.full_name as talent_display_name
       FROM applications a
       JOIN talent_profiles p ON p.user_id = a.talent_user_id
       WHERE a.opportunity_id = ?
       ORDER BY a.id DESC`
    )
    .all(params.opportunityId) as any;
}

export function updateApplicationStatus(params: {
  actorRole: 'ADMIN' | 'COMPANY';
  actorCompanyUserId?: number;
  applicationId: number;
  newStatus: ApplicationStatus;
}): void {
  const db = getDb();

  if (params.actorRole === 'COMPANY') {
    const companyUserId = params.actorCompanyUserId;
    if (!companyUserId) throw new Error('FORBIDDEN');

    const ok = db
      .prepare(
        `SELECT a.id
         FROM applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         WHERE a.id = ? AND o.company_user_id = ?
         LIMIT 1`
      )
      .get(params.applicationId, companyUserId) as any;
    if (!ok) throw new Error('FORBIDDEN');
  }

  const now = new Date().toISOString();
  const hiredAt = params.newStatus === 'hired' ? now : null;

  db.prepare(
    `UPDATE applications
     SET status = ?, status_updated_at = ?, hired_at = COALESCE(?, hired_at)
     WHERE id = ?`
  ).run(params.newStatus, now, hiredAt, params.applicationId);
}
