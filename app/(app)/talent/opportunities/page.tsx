import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listOpenOpportunitiesForTalent } from '@/api/opportunities/opportunities';

export default async function TalentOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const opps = listOpenOpportunitiesForTalent();

  return (
    <div>
      <h1>Opportunities</h1>
      <p className="muted">Apply to roles shared by verified partner companies.</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Unable to apply.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <section className="card">
        {opps.length === 0 ? (
          <p className="muted">No open opportunities yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Location</th>
                <th>Apply</th>
              </tr>
            </thead>
            <tbody>
              {opps.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.title}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>{o.description}</div>
                    {o.requirements_text ? (
                      <div className="note" style={{ marginTop: 8 }}>
                        <strong>Requirements:</strong> {o.requirements_text}
                      </div>
                    ) : null}
                  </td>
                  <td>{o.location}{o.is_remote ? ' (Remote)' : ''}</td>
                  <td>
                    <form method="POST" action="/api/talent/opportunity/apply">
                      <input type="hidden" name="csrfToken" value={session.csrfToken} />
                      <input type="hidden" name="opportunityId" value={o.id} />
                      <button className="btn" type="submit">Apply</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
