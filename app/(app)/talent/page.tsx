import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getTalentLearningSummary, listPublishedModulesForTalent } from '@/api/training/training';

export default async function TalentDashboard() {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const summary = getTalentLearningSummary(session.user.id);
  const modules = listPublishedModulesForTalent(session.user.id);

  const pct = summary.totalItems > 0 ? Math.round((summary.completedItems / summary.totalItems) * 100) : 0;

  return (
    <div>
      <h1>Talent dashboard</h1>
      <p className="muted">
        Your learning plan, opportunities, and messages in one place.
      </p>

      <div className="grid2">
        <section className="card">
          <h2>Learning progress</h2>
          <div className="notice ok">
            <strong>{pct}%</strong> complete ({summary.completedItems} / {summary.totalItems} published items)
          </div>
          <div style={{ marginTop: 12 }}>
            <a className="btn" href="/talent/learning">Continue learning</a>
          </div>
        </section>

        <section className="card">
          <h2>Next modules</h2>
          {modules.length === 0 ? (
            <p className="muted">No modules are published yet.</p>
          ) : (
            <ul className="list">
              {modules.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <a href={`/talent/learning/${m.id}`}>{m.title}</a>
                  <span className="muted"> — {m.completedItems}/{m.totalItems} complete</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div style={{ height: 14 }} />

      <section className="card">
        <h2>Build your profile</h2>
        <p className="muted">
          Your programme profile is structured like a LinkedIn profile: headline, summary, skills, experience, education, and links.
          Keep it accurate and concise.
        </p>
        <a className="btn secondary" href="/talent/profile">Go to my profile</a>
      </section>
    </div>
  );
}
