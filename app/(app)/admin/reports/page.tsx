import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getImpactSnapshot } from '@/api/reports/impact';

export default async function AdminReportsPage() {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const snap = getImpactSnapshot();

  return (
    <div>
      <h1>Reports</h1>
      <p className="muted">
        Export-ready reports for donors and internal monitoring.
      </p>

      <div className="card">
        <h2>Impact snapshot</h2>
        <table className="table">
          <tbody>
            <tr><th>As of</th><td>{snap.asOf}</td></tr>
            <tr><th>Active talents</th><td>{snap.talentsActive}</td></tr>
            <tr><th>Pending talents</th><td>{snap.talentsPending}</td></tr>
            <tr><th>Active companies</th><td>{snap.companiesActive}</td></tr>
            <tr><th>Donors (observer)</th><td>{snap.donorsActive}</td></tr>
            <tr><th>Training completion rate (aggregate)</th><td>{Math.round(snap.trainingCompletionRateAggregate * 100)}%</td></tr>
            <tr><th>Placements (hired)</th><td>{snap.placementsHired}</td></tr>
          </tbody>
        </table>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a className="btn" href="/api/reports/impact.csv">Download impact CSV</a>
          <a className="btn secondary" href="/donor">Preview donor dashboard</a>
        </div>

        <div className="note" style={{ marginTop: 12 }}>
          <strong>Export format:</strong> CSV is used for maximum interoperability (Excel, PowerBI, donor templates).
          In a future phase, add PDF exports with fixed donor branding.
        </div>
      </div>
    </div>
  );
}
