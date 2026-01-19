import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listAdminModules } from '@/api/training/training';

export default async function AdminTrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');
  const sp = await searchParams;
  const modules = listAdminModules();

  return (
    <div>
      <h1>Training content</h1>
      <p className="muted">
        Create modules, add lectures, videos, and documents, then publish when ready.
      </p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Action failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            Error: <code>{sp.error}</code>
          </div>
        </div>
      ) : null}

      <div className="grid2">
        <section className="card">
          <h2>Create module</h2>
          <form method="POST" action="/api/admin/training/module/create" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <label>
              Title
              <input name="title" type="text" required />
            </label>
            <label>
              Description
              <textarea name="description" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input name="isPublished" type="checkbox" />
              Publish immediately
            </label>
            <button className="btn" type="submit">Create module</button>
          </form>
          <div className="note" style={{ marginTop: 12 }}>
            Publishing is reversible by an Admin (not implemented in MVP UI, but supported in DB).
          </div>
        </section>

        <section className="card">
          <h2>Modules</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a href={`/admin/training/${m.id}`}>{m.title}</a>
                    <div className="muted" style={{ fontSize: 13 }}>{m.description}</div>
                  </td>
                  <td>{m.is_published ? <span className="badge">Published</span> : <span className="badge">Draft</span>}</td>
                  <td>{m.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
