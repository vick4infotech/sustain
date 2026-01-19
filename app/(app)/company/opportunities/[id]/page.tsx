import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getCompanyOpportunity, listOpportunityApplicationsForCompany } from '@/api/opportunities/opportunities';

const STATUSES = ['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'] as const;

export default async function CompanyOpportunityDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const p = await params;
  const sp = await searchParams;
  const opportunityId = Number(p.id || 0);
  if (!opportunityId) redirect('/company/opportunities');

  const opp = getCompanyOpportunity({ companyUserId: session.user.id, opportunityId });
  if (!opp) redirect('/company/opportunities');

  const apps = listOpportunityApplicationsForCompany({ opportunityId, companyUserId: session.user.id });

  return (
    <div>
      <h1>{opp.title}</h1>
      <p className="muted">{opp.location}{opp.is_remote ? ' (Remote)' : ''}</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Update failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <section className="card">
        <h2>Applicants</h2>
        {apps.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Talent</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Update</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td>{a.talent_display_name || 'Talent'}</td>
                  <td><span className="badge">{a.status}</span></td>
                  <td>{a.applied_at}</td>
                  <td>
                    <form method="POST" action="/api/company/application/update" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="hidden" name="csrfToken" value={session.csrfToken} />
                      <input type="hidden" name="opportunityId" value={opportunityId} />
                      <input type="hidden" name="applicationId" value={a.id} />
                      <select name="newStatus" defaultValue={a.status}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="btn secondary" type="submit">Save</button>
                    </form>
                  </td>
                  <td>
                    <a className="btn secondary" href={`/company/talent/${a.talent_user_id}`}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        Profiles are shown in a limited, compliant format (no direct contact details).
      </div>
    </div>
  );
}
