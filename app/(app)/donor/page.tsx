import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getImpactSnapshot } from '@/api/reports/impact';

export default async function DonorDashboard() {
  const session = await requireSession(['DONOR']);
  if (session.user.status !== 'active') redirect('/pending');

  const snap = getImpactSnapshot();

  return (
    <div>
      <h1>Donor dashboard</h1>
      <p className="muted">Read-only, aggregate visibility for transparency and trust.</p>

      <section className="card">
        <h2>Programme snapshot</h2>
        <div className="grid2">
          <div>
            <div className="muted">Active talents</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{snap.talentsActive}</div>
          </div>
          <div>
            <div className="muted">Training completion (aggregate)</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{Math.round(snap.trainingCompletionRateAggregate * 100)}%</div>
          </div>
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          <div>
            <div className="muted">Placements (hires)</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{snap.placementsHired}</div>
          </div>
          <div>
            <div className="muted">Open opportunities</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{snap.opportunitiesOpen}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <a className="btn" href="/donor/reports">Reports</a>
        </div>
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        This MVP uses a local SQLite database for demo purposes. For production-grade, auditable reporting,
        migrate to a managed database and persistent file storage.
      </div>
    </div>
  );
}
