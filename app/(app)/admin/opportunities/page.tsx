import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listAllOpportunitiesForAdmin } from '@/api/opportunities/opportunities';

export default async function AdminOpportunitiesPage() {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const opps = listAllOpportunitiesForAdmin();

  return (
    <div>
      <h1>Opportunities & placements</h1>
      <p className="muted">
        Admin oversight across employer engagement, applications, and hires.
      </p>

      <section className="card">
        <h2>All opportunities</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Opportunity</th>
              <th>Company</th>
              <th>Status</th>
              <th>Applications</th>
              <th>Hired</th>
            </tr>
          </thead>
          <tbody>
            {opps.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{o.location}{o.is_remote ? ' (Remote)' : ''}</div>
                </td>
                <td>
                  {o.company_name ? <strong>{o.company_name}</strong> : <span className="muted">(Unverified company name)</span>}
                  <div className="muted" style={{ fontSize: 13 }}>{o.company_email}</div>
                </td>
                <td><span className="badge">{o.status}</span></td>
                <td>{o.application_count}</td>
                <td>{o.hired_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ height: 14 }} />

      <div className="note">
        <strong>M&E note:</strong> In production, placements are usually verified via supporting evidence (offer letters or payroll confirmation). MVP tracks status updates only.
      </div>
    </div>
  );
}
