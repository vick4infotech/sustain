import 'server-only';

import { getDb } from '@/db/connection';

export type TalentProfile = {
  userId: number;
  fullName: string;
  headline: string;
  about: string;
  locationCountry: string;
  locationCity: string;
  languages: string;
  interests: string;
  profileVisibility: boolean;
  skills: string[];
  experiences: TalentExperience[];
  education: TalentEducation[];
  certifications: TalentCertification[];
  links: TalentLink[];
};

export type TalentExperience = {
  id: number;
  title: string;
  organisation: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

export type TalentEducation = {
  id: number;
  institution: string;
  degree: string;
  field: string;
  startYear: number | null;
  endYear: number | null;
  description: string;
};

export type TalentCertification = {
  id: number;
  name: string;
  issuer: string;
  issueYear: number | null;
  expiresYear: number | null;
};

export type TalentLink = {
  id: number;
  label: string;
  url: string;
};

export function getTalentProfile(userId: number): TalentProfile {
  const db = getDb();

  const p = db
    .prepare(
      `SELECT user_id, full_name, headline, about, location_country, location_city, languages, interests, profile_visibility
       FROM talent_profiles WHERE user_id = ?`
    )
    .get(userId) as any;

  if (!p) {
    // Defensive: profile should exist.
    db.prepare(
      `INSERT INTO talent_profiles (user_id, full_name, profile_visibility, created_at, updated_at)
       VALUES (?, '', 1, ?, ?)`
    ).run(userId, new Date().toISOString(), new Date().toISOString());
  }

  const skills = db
    .prepare(
      `SELECT s.name
       FROM talent_skills ts
       JOIN skills s ON s.id = ts.skill_id
       WHERE ts.talent_user_id = ?
       ORDER BY s.name ASC`
    )
    .all(userId)
    .map((r: any) => r.name) as string[];

  const experiences = db
    .prepare(
      `SELECT id, title, organisation, location, start_date, end_date, is_current, description
       FROM talent_experiences
       WHERE talent_user_id = ?
       ORDER BY id DESC`
    )
    .all(userId)
    .map((r: any) => ({
      id: r.id,
      title: r.title || '',
      organisation: r.organisation || '',
      location: r.location || '',
      startDate: r.start_date || '',
      endDate: r.end_date || '',
      isCurrent: Boolean(r.is_current),
      description: r.description || '',
    })) as TalentExperience[];

  const education = db
    .prepare(
      `SELECT id, institution, degree, field, start_year, end_year, description
       FROM talent_education
       WHERE talent_user_id = ?
       ORDER BY id DESC`
    )
    .all(userId)
    .map((r: any) => ({
      id: r.id,
      institution: r.institution || '',
      degree: r.degree || '',
      field: r.field || '',
      startYear: r.start_year ?? null,
      endYear: r.end_year ?? null,
      description: r.description || '',
    })) as TalentEducation[];

  const certifications = db
    .prepare(
      `SELECT id, name, issuer, issue_year, expires_year
       FROM talent_certifications
       WHERE talent_user_id = ?
       ORDER BY id DESC`
    )
    .all(userId)
    .map((r: any) => ({
      id: r.id,
      name: r.name || '',
      issuer: r.issuer || '',
      issueYear: r.issue_year ?? null,
      expiresYear: r.expires_year ?? null,
    })) as TalentCertification[];

  const links = db
    .prepare(`SELECT id, label, url FROM talent_links WHERE talent_user_id = ? ORDER BY id DESC`)
    .all(userId)
    .map((r: any) => ({ id: r.id, label: r.label || '', url: r.url || '' })) as TalentLink[];

  const final = (p || db.prepare(`SELECT * FROM talent_profiles WHERE user_id = ?`).get(userId) as any);

  return {
    userId,
    fullName: final?.full_name || '',
    headline: final?.headline || '',
    about: final?.about || '',
    locationCountry: final?.location_country || '',
    locationCity: final?.location_city || '',
    languages: final?.languages || '',
    interests: final?.interests || '',
    profileVisibility: Boolean(final?.profile_visibility),
    skills,
    experiences,
    education,
    certifications,
    links,
  };
}

export function updateTalentProfileMain(userId: number, fields: Partial<Omit<TalentProfile, 'userId' | 'skills' | 'experiences' | 'education' | 'certifications' | 'links'>>) {
  const db = getDb();
  db.prepare(
    `UPDATE talent_profiles
     SET full_name = ?, headline = ?, about = ?, location_country = ?, location_city = ?, languages = ?, interests = ?, profile_visibility = ?, updated_at = ?
     WHERE user_id = ?`
  ).run(
    (fields.fullName ?? '').trim(),
    (fields.headline ?? '').trim(),
    (fields.about ?? '').trim(),
    (fields.locationCountry ?? '').trim(),
    (fields.locationCity ?? '').trim(),
    (fields.languages ?? '').trim(),
    (fields.interests ?? '').trim(),
    fields.profileVisibility ? 1 : 0,
    new Date().toISOString(),
    userId
  );
}

export function addSkill(userId: number, skillName: string) {
  const db = getDb();
  const name = skillName.trim();
  if (!name) return;

  const tx = db.transaction(() => {
    const existing = db.prepare(`SELECT id FROM skills WHERE lower(name) = lower(?) LIMIT 1`).get(name) as any;
    const skillId = existing
      ? existing.id
      : Number(db.prepare(`INSERT INTO skills (name) VALUES (?)`).run(name).lastInsertRowid);

    db.prepare(`INSERT OR IGNORE INTO talent_skills (talent_user_id, skill_id) VALUES (?, ?)`).run(userId, skillId);
  });

  tx();
}

export function removeSkill(userId: number, skillName: string) {
  const db = getDb();
  const row = db.prepare(`SELECT id FROM skills WHERE lower(name) = lower(?) LIMIT 1`).get(skillName.trim()) as any;
  if (!row) return;
  db.prepare(`DELETE FROM talent_skills WHERE talent_user_id = ? AND skill_id = ?`).run(userId, row.id);
}

export function addExperience(userId: number, exp: Omit<TalentExperience, 'id'>) {
  const db = getDb();
  db.prepare(
    `INSERT INTO talent_experiences (talent_user_id, title, organisation, location, start_date, end_date, is_current, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    exp.title.trim(),
    exp.organisation.trim(),
    exp.location.trim(),
    exp.startDate.trim(),
    exp.endDate.trim(),
    exp.isCurrent ? 1 : 0,
    exp.description.trim()
  );
}

export function removeExperience(userId: number, experienceId: number) {
  const db = getDb();
  db.prepare(`DELETE FROM talent_experiences WHERE id = ? AND talent_user_id = ?`).run(experienceId, userId);
}

export function addEducation(userId: number, edu: Omit<TalentEducation, 'id'>) {
  const db = getDb();
  db.prepare(
    `INSERT INTO talent_education (talent_user_id, institution, degree, field, start_year, end_year, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    edu.institution.trim(),
    edu.degree.trim(),
    edu.field.trim(),
    edu.startYear,
    edu.endYear,
    edu.description.trim()
  );
}

export function removeEducation(userId: number, educationId: number) {
  const db = getDb();
  db.prepare(`DELETE FROM talent_education WHERE id = ? AND talent_user_id = ?`).run(educationId, userId);
}

export function addCertification(userId: number, cert: Omit<TalentCertification, 'id'>) {
  const db = getDb();
  db.prepare(
    `INSERT INTO talent_certifications (talent_user_id, name, issuer, issue_year, expires_year)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, cert.name.trim(), cert.issuer.trim(), cert.issueYear, cert.expiresYear);
}

export function removeCertification(userId: number, certId: number) {
  const db = getDb();
  db.prepare(`DELETE FROM talent_certifications WHERE id = ? AND talent_user_id = ?`).run(certId, userId);
}

export function addLink(userId: number, link: Omit<TalentLink, 'id'>) {
  const db = getDb();
  db.prepare(`INSERT INTO talent_links (talent_user_id, label, url) VALUES (?, ?, ?)`).run(
    userId,
    link.label.trim(),
    link.url.trim()
  );
}

export function removeLink(userId: number, linkId: number) {
  const db = getDb();
  db.prepare(`DELETE FROM talent_links WHERE id = ? AND talent_user_id = ?`).run(linkId, userId);
}

// --- Company-facing (compliant projection) ---

export type CompanyTalentCard = {
  userId: number;
  displayName: string;
  headline: string;
  locationCountry: string;
  skills: string[];
};

export function searchTalentsForCompany(params: {
  query?: string;
  country?: string;
  skill?: string;
  limit?: number;
}): CompanyTalentCard[] {
  const db = getDb();
  const q = (params.query || '').trim().toLowerCase();
  const country = (params.country || '').trim().toLowerCase();
  const skill = (params.skill || '').trim().toLowerCase();
  const limit = params.limit ?? 50;

  // NOTE: simple MVP search. For scale, move to FTS or Postgres.
  const base = db
    .prepare(
      `SELECT p.user_id, p.full_name, p.headline, p.location_country, p.profile_visibility
       FROM talent_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE u.role = 'TALENT' AND u.status = 'active'
       ORDER BY p.user_id DESC
       LIMIT ?`
    )
    .all(limit * 2) as any[];

  const filtered = base.filter((r) => {
    if (!r.profile_visibility) return false;
    if (country && String(r.location_country || '').toLowerCase() !== country) return false;
    if (q) {
      const hay = `${r.full_name || ''} ${r.headline || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const cards: CompanyTalentCard[] = [];
  for (const r of filtered.slice(0, limit)) {
    const skills = db
      .prepare(
        `SELECT s.name
         FROM talent_skills ts
         JOIN skills s ON s.id = ts.skill_id
         WHERE ts.talent_user_id = ?
         ORDER BY s.name ASC`
      )
      .all(r.user_id)
      .map((x: any) => x.name) as string[];

    if (skill && !skills.some((s) => s.toLowerCase() === skill)) continue;

    cards.push({
      userId: r.user_id,
      displayName: r.full_name || 'Talent',
      headline: r.headline || '',
      locationCountry: r.location_country || '',
      skills,
    });
  }

  return cards;
}

export type CompanyVisibleTalentProfile = {
  userId: number;
  displayName: string;
  headline: string;
  about: string;
  locationCountry: string;
  languages: string;
  skills: string[];
  experiences: Array<Pick<TalentExperience, 'title' | 'organisation' | 'startDate' | 'endDate' | 'isCurrent' | 'description'>>;
  education: Array<Pick<TalentEducation, 'institution' | 'degree' | 'field' | 'startYear' | 'endYear' | 'description'>>;
  links: TalentLink[];
};

export function getTalentProfileForCompanyView(talentUserId: number): CompanyVisibleTalentProfile | null {
  const db = getDb();

  const p = db
    .prepare(
      `SELECT p.user_id, p.full_name, p.headline, p.about, p.location_country, p.languages, p.profile_visibility
       FROM talent_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? AND u.role = 'TALENT' AND u.status = 'active'
       LIMIT 1`
    )
    .get(talentUserId) as any;

  if (!p) return null;
  if (!p.profile_visibility) return null;

  const skills = db
    .prepare(
      `SELECT s.name
       FROM talent_skills ts
       JOIN skills s ON s.id = ts.skill_id
       WHERE ts.talent_user_id = ?
       ORDER BY s.name ASC`
    )
    .all(talentUserId)
    .map((r: any) => r.name) as string[];

  const experiences = db
    .prepare(
      `SELECT title, organisation, start_date, end_date, is_current, description
       FROM talent_experiences
       WHERE talent_user_id = ?
       ORDER BY id DESC
       LIMIT 20`
    )
    .all(talentUserId)
    .map((r: any) => ({
      title: r.title || '',
      organisation: r.organisation || '',
      startDate: r.start_date || '',
      endDate: r.end_date || '',
      isCurrent: Boolean(r.is_current),
      description: r.description || '',
    }));

  const education = db
    .prepare(
      `SELECT institution, degree, field, start_year, end_year, description
       FROM talent_education
       WHERE talent_user_id = ?
       ORDER BY id DESC
       LIMIT 20`
    )
    .all(talentUserId)
    .map((r: any) => ({
      institution: r.institution || '',
      degree: r.degree || '',
      field: r.field || '',
      startYear: r.start_year ?? null,
      endYear: r.end_year ?? null,
      description: r.description || '',
    }));

  const links = db
    .prepare(`SELECT id, label, url FROM talent_links WHERE talent_user_id = ? ORDER BY id DESC LIMIT 20`)
    .all(talentUserId)
    .map((r: any) => ({ id: r.id, label: r.label || '', url: r.url || '' })) as TalentLink[];

  return {
    userId: talentUserId,
    displayName: p.full_name || 'Talent',
    headline: p.headline || '',
    about: p.about || '',
    locationCountry: p.location_country || '',
    languages: p.languages || '',
    skills,
    experiences,
    education,
    links,
  };
}
