import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getCompanyProfile } from '@/api/users/companyProfile';
import { getCompanyHiringSummary } from '@/api/opportunities/opportunities';

export default async function CompanyDashboard() {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const profile = getCompanyProfile(session.user.id);
  const sum = getCompanyHiringSummary(session.user.id);

  return (
    <div>
      <h1>Company dashboard</h1>
      <p className="muted">Post opportunities, review applicants, and message the programme team.</p>

      <section className="card">
        <h2>Your organisation</h2>
        <div><strong>{profile.companyName || session.user.email}</strong></div>
        <div className="muted" style={{ marginTop: 6 }}>Sector: {profile.sector || '—'} • Website: {profile.website || '—'}</div>
        <div style={{ marginTop: 12 }}>
          <a className="btn secondary" href="/company/profile">Edit company profile</a>
        </div>
      </section>

      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="card">
          <h2>Hiring summary</h2>
          <div className="kpi-row">
            <div className="kpi"><div className="kpi-label">Open opportunities</div><div className="kpi-value">{sum.opportunitiesOpen}</div></div>
            <div className="kpi"><div className="kpi-label">Applications</div><div className="kpi-value">{sum.applicationsTotal}</div></div>
            <div className="kpi"><div className="kpi-label">Hires</div><div className="kpi-value">{sum.hires}</div></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <a className="btn" href="/company/opportunities">Manage opportunities</a>
          </div>
        </section>

        <section className="card">
          <h2>Talent search</h2>
          <p className="muted">Search for programme talents using compliant, limited profiles.</p>
          <a className="btn secondary" href="/company/talent">Search talent</a>
        </section>
      </div>
    </div>
  );
}
