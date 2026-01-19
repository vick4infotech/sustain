import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listPublishedModulesForTalent } from '@/api/training/training';

export default async function TalentLearningPage() {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const modules = listPublishedModulesForTalent(session.user.id);

  return (
    <div>
      <h1>Learning</h1>
      <p className="muted">Modules published by the programme team.</p>

      <div className="card">
        {modules.length === 0 ? (
          <p className="muted">No published modules yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={`/talent/learning/${m.id}`}>{m.title}</a>
                    <div className="muted" style={{ fontSize: 13 }}>{m.description}</div>
                  </td>
                  <td>
                    {m.totalItems === 0 ? (
                      <span className="muted">No items</span>
                    ) : (
                      <span>{m.completedItems}/{m.totalItems}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
