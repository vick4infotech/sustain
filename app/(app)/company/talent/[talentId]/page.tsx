import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getTalentProfileForCompanyView } from '@/api/talent/profile';
import { listMessagingRecipientsFor } from '@/api/messages/messages';

export default async function CompanyTalentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ talentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const p = await params;
  const sp = await searchParams;
  const talentUserId = Number(p.talentId || 0);
  if (!talentUserId) redirect('/company/talent');

  const profile = getTalentProfileForCompanyView(talentUserId);
  if (!profile) {
    return (
      <div className="card">
        <h1>Profile not available</h1>
        <p className="muted">This talent has not opted in to employer visibility, or the profile is not active.</p>
        <div style={{ marginTop: 12 }}>
          <a className="btn secondary" href="/company/talent">Back to search</a>
        </div>
      </div>
    );
  }

  const recipients = listMessagingRecipientsFor(session.user.id, session.user.role);
  const canMessage = recipients.some((r) => r.id === talentUserId);

  return (
    <div>
      <div className="pagehead">
        <div>
          <h1 style={{ marginBottom: 6 }}>{profile.displayName}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{profile.headline || '—'}</p>
        </div>
        <div className="pagehead-actions">
          <a className="btn secondary btn--sm" href="/company/talent">Back to search</a>
        </div>
      </div>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Unable to send message.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <section className="card">
        <h2>Summary</h2>
        {profile.about ? <p style={{ whiteSpace: 'pre-wrap' }}>{profile.about}</p> : <p className="muted">No summary provided.</p>}

        <div className="grid2" style={{ marginTop: 14 }}>
          <div>
            <div className="muted">Location</div>
            <div><strong>{profile.locationCountry || '—'}</strong></div>
          </div>
          <div>
            <div className="muted">Languages</div>
            <div><strong>{profile.languages || '—'}</strong></div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="muted">Skills</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.skills.length
              ? profile.skills.map((s) => (
                  <span key={s} className="chip chip--accent">{s}</span>
                ))
              : <span className="muted">—</span>}
          </div>
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="card">
          <h2>Experience</h2>
          {profile.experiences.length === 0 ? (
            <p className="muted">No experience entries shared.</p>
          ) : (
            <ul className="list">
              {profile.experiences.map((e, idx) => (
                <li key={`${e.title}-${e.organisation}-${idx}`}>
                  <strong>{e.title}</strong> — {e.organisation}
                  <div className="muted" style={{ fontSize: 13 }}>{e.startDate || '—'} – {e.isCurrent ? 'Present' : (e.endDate || '—')}</div>
                  {e.description ? <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{e.description}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Education</h2>
          {profile.education.length === 0 ? (
            <p className="muted">No education entries shared.</p>
          ) : (
            <ul className="list">
              {profile.education.map((ed, idx) => (
                <li key={`${ed.institution}-${ed.degree}-${idx}`}>
                  <strong>{ed.institution}</strong> — {ed.degree}
                  {ed.field ? <div className="muted" style={{ fontSize: 13 }}>Field: {ed.field}</div> : null}
                  <div className="muted" style={{ fontSize: 13 }}>{ed.startYear || '—'} – {ed.endYear || '—'}</div>
                  {ed.description ? <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{ed.description}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Message</h2>
        {canMessage ? (
          <form method="POST" action="/api/messages/send" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="returnTo" value={`/company/talent/${talentUserId}`} />
            <input type="hidden" name="recipientUserId" value={talentUserId} />

            <label>
              Subject
              <input name="subject" type="text" required />
            </label>

            <label>
              Message
              <textarea name="body" required />
            </label>

            <button className="btn" type="submit">Send message</button>
          </form>
        ) : (
          <p className="muted">
            Messaging is enabled only for talents with an active application relationship (MVP anti-spam safeguard).
            If you want to approach a talent proactively, coordinate via the Admin team.
          </p>
        )}
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        <strong>Compliance note:</strong> direct contact details are withheld. Communications remain inside the platform for auditability.
      </div>
    </div>
  );
}
