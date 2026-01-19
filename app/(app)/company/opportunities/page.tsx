import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listCompanyOpportunities } from '@/api/opportunities/opportunities';

export default async function CompanyOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const opps = listCompanyOpportunities(session.user.id);

  return (
    <div>
      <h1>Opportunities</h1>
      <p className="muted">Post, review applicants, and track outcomes.</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Action failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}
      {sp.created ? <div className="note">Opportunity created.</div> : null}

      <div className="grid2">
        <section className="card">
          <h2>Create opportunity</h2>
          <form method="POST" action="/api/company/opportunity/create" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />

            <label>
              Title
              <input name="title" type="text" required />
            </label>

            <label>
              Description
              <textarea name="description" required />
            </label>

            <label>
              Location
              <input name="location" type="text" placeholder="City, Country" required />
            </label>

            <label>
              Requirements (optional)
              <textarea name="requirementsText" placeholder="Skills, experience, language requirements" />
            </label>

            <label>
              <input name="isRemote" type="checkbox" /> Remote-friendly
            </label>

            <button className="btn" type="submit">Publish</button>
          </form>
        </section>

        <section className="card">
          <h2>Your listings</h2>
          {opps.length === 0 ? (
            <p className="muted">No opportunities yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.title}</strong><div className="muted" style={{ fontSize: 13 }}>{o.location}</div></td>
                    <td><span className="badge">{o.status}</span></td>
                    <td><a className="btn secondary" href={`/company/opportunities/${o.id}`}>Applicants</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
