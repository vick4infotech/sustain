import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listTalentApplications } from '@/api/opportunities/opportunities';

export default async function TalentApplicationsPage() {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const apps = listTalentApplications(session.user.id);

  return (
    <div>
      <h1>My applications</h1>
      <p className="muted">Track your application status with companies.</p>

      <section className="card">
        {apps.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Opportunity</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.opportunity_title}</strong></td>
                  <td><span className="badge">{a.status}</span></td>
                  <td>{a.applied_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
