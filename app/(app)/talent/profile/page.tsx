import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getTalentProfile } from '@/api/talent/profile';

export default async function TalentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const p = getTalentProfile(session.user.id);

  return (
    <div>
      <h1>My profile</h1>
      <p className="muted">
        LinkedIn-style, programme-safe profile used for matching with opportunities. Companies see a limited view unless you enable visibility.
      </p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Update failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <div className="grid2">
        <section className="card">
          <h2>Profile basics</h2>
          <form method="POST" action="/api/talent/profile" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="update_main" />

            <label>
              Full name
              <input name="fullName" type="text" defaultValue={p.fullName} required />
            </label>

            <label>
              Headline
              <input name="headline" type="text" defaultValue={p.headline} placeholder="e.g. Renewable energy technician" />
            </label>

            <label>
              About
              <textarea name="about" defaultValue={p.about} placeholder="Short summary of your experience and goals..." />
            </label>

            <div className="row">
              <label>
                Country
                <input name="locationCountry" type="text" defaultValue={p.locationCountry} />
              </label>
              <label>
                City
                <input name="locationCity" type="text" defaultValue={p.locationCity} />
              </label>
            </div>

            <label>
              Languages
              <input name="languages" type="text" defaultValue={p.languages} placeholder="e.g. English, French" />
            </label>

            <label>
              Interests
              <input name="interests" type="text" defaultValue={p.interests} placeholder="e.g. green jobs, logistics" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input name="profileVisibility" type="checkbox" defaultChecked={p.profileVisibility} />
              Allow companies to view my profile (limited, compliant)
            </label>

            <button className="btn" type="submit">Save</button>
          </form>
        </section>

        <section className="card">
          <h2>Skills</h2>
          <div className="muted" style={{ fontSize: 13 }}>Add skills for matching and reporting.</div>

          <div style={{ marginTop: 10 }}>
            {p.skills.length === 0 ? <p className="muted">No skills added yet.</p> : null}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p.skills.map((s) => (
                <form key={s} method="POST" action="/api/talent/profile">
                  <input type="hidden" name="csrfToken" value={session.csrfToken} />
                  <input type="hidden" name="action" value="remove_skill" />
                  <input type="hidden" name="skillName" value={s} />
                  <button className="badge" type="submit" title="Remove skill">{s} ×</button>
                </form>
              ))}
            </div>
          </div>

          <form method="POST" action="/api/talent/profile" className="form" style={{ marginTop: 14 }}>
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="add_skill" />
            <label>
              Add skill
              <input name="skillName" type="text" placeholder="e.g. Excel, JavaScript" />
            </label>
            <button className="btn secondary" type="submit">Add</button>
          </form>

          <div className="hr" />

          <h2>Experience</h2>
          {p.experiences.length === 0 ? <p className="muted">No experience entries yet.</p> : null}
          {p.experiences.map((e) => (
            <div key={e.id} className="notice" style={{ marginTop: 10 }}>
              <strong>{e.title}</strong> — {e.organisation}
              <div className="muted" style={{ fontSize: 13 }}>{e.startDate} → {e.isCurrent ? 'Present' : (e.endDate || '—')}</div>
              {e.description ? <div style={{ marginTop: 6 }}>{e.description}</div> : null}
              <form method="POST" action="/api/talent/profile" style={{ marginTop: 8 }}>
                <input type="hidden" name="csrfToken" value={session.csrfToken} />
                <input type="hidden" name="action" value="remove_experience" />
                <input type="hidden" name="experienceId" value={e.id} />
                <button className="btn secondary" type="submit">Remove</button>
              </form>
            </div>
          ))}

          <form method="POST" action="/api/talent/profile" className="form" style={{ marginTop: 14 }}>
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="add_experience" />
            <label>Title<input name="title" type="text" required /></label>
            <label>Organisation<input name="organisation" type="text" required /></label>
            <div className="row">
              <label>Start (YYYY-MM)<input name="startDate" type="text" placeholder="2025-01" /></label>
              <label>End (YYYY-MM)<input name="endDate" type="text" placeholder="2025-10" /></label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input name="isCurrent" type="checkbox" />
              I currently work here
            </label>
            <label>Description<textarea name="description" /></label>
            <button className="btn secondary" type="submit">Add experience</button>
          </form>
        </section>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid2">
        <section className="card">
          <h2>Education</h2>
          {p.education.length === 0 ? <p className="muted">No education entries yet.</p> : null}
          {p.education.map((ed) => (
            <div key={ed.id} className="notice" style={{ marginTop: 10 }}>
              <strong>{ed.degree}</strong> — {ed.institution}
              <div className="muted" style={{ fontSize: 13 }}>{ed.startYear || '—'} → {ed.endYear || '—'}</div>
              {ed.field ? <div style={{ marginTop: 6 }}><span className="muted">Field:</span> {ed.field}</div> : null}
              {ed.description ? <div style={{ marginTop: 6 }}>{ed.description}</div> : null}
              <form method="POST" action="/api/talent/profile" style={{ marginTop: 8 }}>
                <input type="hidden" name="csrfToken" value={session.csrfToken} />
                <input type="hidden" name="action" value="remove_education" />
                <input type="hidden" name="educationId" value={ed.id} />
                <button className="btn secondary" type="submit">Remove</button>
              </form>
            </div>
          ))}

          <form method="POST" action="/api/talent/profile" className="form" style={{ marginTop: 14 }}>
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="add_education" />
            <label>Institution<input name="institution" type="text" required /></label>
            <label>Degree<input name="degree" type="text" required /></label>
            <label>Field<input name="field" type="text" /></label>
            <div className="row">
              <label>Start year<input name="startYear" type="number" min={1950} max={2100} /></label>
              <label>End year<input name="endYear" type="number" min={1950} max={2100} /></label>
            </div>
            <label>Description<textarea name="description" /></label>
            <button className="btn secondary" type="submit">Add education</button>
          </form>
        </section>

        <section className="card">
          <h2>Links & certifications</h2>
          <p className="muted">Optional—help employers verify work samples.</p>

          <h3>Links</h3>
          {p.links.length === 0 ? <p className="muted">No links added yet.</p> : null}
          {p.links.map((l) => (
            <div key={l.id} className="notice" style={{ marginTop: 10 }}>
              <strong>{l.label}</strong>
              <div className="muted" style={{ fontSize: 13 }}><a href={l.url} target="_blank" rel="noreferrer">{l.url}</a></div>
              <form method="POST" action="/api/talent/profile" style={{ marginTop: 8 }}>
                <input type="hidden" name="csrfToken" value={session.csrfToken} />
                <input type="hidden" name="action" value="remove_link" />
                <input type="hidden" name="linkId" value={l.id} />
                <button className="btn secondary" type="submit">Remove</button>
              </form>
            </div>
          ))}
          <form method="POST" action="/api/talent/profile" className="form" style={{ marginTop: 14 }}>
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="add_link" />
            <label>Label<input name="label" type="text" placeholder="Portfolio / GitHub / LinkedIn" required /></label>
            <label>URL<input name="url" type="url" placeholder="https://..." required /></label>
            <button className="btn secondary" type="submit">Add link</button>
          </form>

          <div className="hr" />

          <h3>Certifications</h3>
          {p.certifications.length === 0 ? <p className="muted">No certifications added yet.</p> : null}
          {p.certifications.map((c) => (
            <div key={c.id} className="notice" style={{ marginTop: 10 }}>
              <strong>{c.name}</strong> — {c.issuer}
              <div className="muted" style={{ fontSize: 13 }}>Issued: {c.issueYear || '—'} • Expires: {c.expiresYear || '—'}</div>
              <form method="POST" action="/api/talent/profile" style={{ marginTop: 8 }}>
                <input type="hidden" name="csrfToken" value={session.csrfToken} />
                <input type="hidden" name="action" value="remove_cert" />
                <input type="hidden" name="certId" value={c.id} />
                <button className="btn secondary" type="submit">Remove</button>
              </form>
            </div>
          ))}
          <form method="POST" action="/api/talent/profile" className="form" style={{ marginTop: 14 }}>
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="action" value="add_cert" />
            <label>Name<input name="name" type="text" required /></label>
            <label>Issuer<input name="issuer" type="text" required /></label>
            <div className="row">
              <label>Issue year<input name="issueYear" type="number" min={1950} max={2100} /></label>
              <label>Expires year<input name="expiresYear" type="number" min={1950} max={2100} /></label>
            </div>
            <button className="btn secondary" type="submit">Add certification</button>
          </form>
        </section>
      </div>
    </div>
  );
}
