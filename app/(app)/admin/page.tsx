import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getImpactSnapshot } from '@/api/reports/impact';

export default async function AdminDashboard() {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const snap = getImpactSnapshot();

  return (
    <div>
      <h1>Admin dashboard</h1>
      <p className="muted">
        Programme oversight: training delivery, employer engagement, donor-ready reporting.
      </p>

      <div className="grid2">
        <div className="card">
          <h2>Impact snapshot</h2>
          <table className="table">
            <tbody>
              <tr><th>As of</th><td>{snap.asOf}</td></tr>
              <tr><th>Active talents</th><td>{snap.talentsActive}</td></tr>
              <tr><th>Pending talents</th><td>{snap.talentsPending}</td></tr>
              <tr><th>Active companies</th><td>{snap.companiesActive}</td></tr>
              <tr><th>Open opportunities</th><td>{snap.opportunitiesOpen}</td></tr>
              <tr><th>Applications total</th><td>{snap.applicationsTotal}</td></tr>
              <tr><th>Placements (hired)</th><td>{snap.placementsHired}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <a className="btn secondary" href="/api/reports/impact.csv">Download impact CSV</a>
          </div>
        </div>

        <div className="card">
          <h2>Training</h2>
          <p className="muted">Published modules: {snap.trainingModulesPublished} — Published items: {snap.trainingItemsPublished}</p>
          <div className="notice ok">
            <strong>Aggregate completion rate:</strong>{' '}
            {Math.round(snap.trainingCompletionRateAggregate * 100)}%
          </div>
          <div style={{ marginTop: 12 }} className="muted">
            Go to <a href="/admin/training">Training</a> to create modules, upload files, and publish content.
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <h2>Quick actions</h2>
        <ul className="list">
          <li><a href="/admin/users">Create/manage users</a> (invite companies, donors, and staff)</li>
          <li><a href="/admin/opportunities">Monitor opportunities & placements</a></li>
          <li><a href="/admin/messages">Message talents and companies</a></li>
          <li><a href="/admin/audit">Review audit log</a> for governance and compliance evidence</li>
        </ul>
      </div>
    </div>
  );
}
