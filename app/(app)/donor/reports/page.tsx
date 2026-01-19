import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getImpactSnapshot } from '@/api/reports/impact';

export default async function DonorReportsPage() {
  const session = await requireSession(['DONOR']);
  if (session.user.status !== 'active') redirect('/pending');

  const snap = getImpactSnapshot();

  return (
    <div>
      <h1>Reports</h1>
      <p className="muted">Aggregated, export-ready programme reporting. (Read-only)</p>

      <section className="card">
        <h2>Impact report export</h2>
        <p className="muted">
          Download a CSV snapshot suitable for inclusion in donor update packs.
        </p>
        <a className="btn" href="/api/reports/impact.csv">Download CSV</a>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>As-of summary</h2>
        <table className="table">
          <tbody>
            <tr><td>As-of</td><td><strong>{snap.asOf}</strong></td></tr>
            <tr><td>Active talents</td><td><strong>{snap.talentsActive}</strong></td></tr>
            <tr><td>Companies (active)</td><td><strong>{snap.companiesActive}</strong></td></tr>
            <tr><td>Published training items</td><td><strong>{snap.trainingItemsPublished}</strong></td></tr>
            <tr><td>Placements (hired)</td><td><strong>{snap.placementsHired}</strong></td></tr>
          </tbody>
        </table>
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        Export actions are logged in the audit trail (Admin-accessible) for accountability.
      </div>
    </div>
  );
}
