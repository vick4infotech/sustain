import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getAdminModule } from '@/api/training/training';

export default async function AdminModuleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const p = await params;
  const sp = await searchParams;
  const moduleId = Number(p.moduleId || 0);
  if (!moduleId) redirect('/admin/training');

  const m = getAdminModule(moduleId);
  if (!m) redirect('/admin/training?error=not_found');

  return (
    <div>
      <h1>Module: {m.module.title}</h1>
      <p className="muted">{m.module.description}</p>

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
          <h2>Add item</h2>
          <form method="POST" action="/api/admin/training/item/create" className="form" encType="multipart/form-data">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="moduleId" value={moduleId} />

            <label>
              Type
              <select name="type" defaultValue="LECTURE">
                <option value="LECTURE">Lecture (text)</option>
                <option value="VIDEO">Video (URL or upload)</option>
                <option value="DOCUMENT">Document (upload)</option>
              </select>
            </label>

            <label>
              Title
              <input name="title" type="text" required />
            </label>

            <div className="row">
              <label>
                Order
                <input name="orderIndex" type="number" min={0} defaultValue={0} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
                <input name="isPublished" type="checkbox" />
                Publish immediately
              </label>
            </div>

            <label>
              Lecture content <span className="muted">(for Lecture type)</span>
              <textarea name="bodyText" placeholder="Write the lecture content here..." />
            </label>

            <label>
              Video URL <span className="muted">(for Video type, optional if uploading)</span>
              <input name="contentUrl" type="url" placeholder="https://..." />
            </label>

            <label>
              Upload file <span className="muted">(for Document, or Video upload)</span>
              <input name="file" type="file" />
              <span className="muted" style={{ fontSize: 13 }}>MVP limit: 20 MB per file.</span>
            </label>

            <button className="btn" type="submit">Create item</button>
          </form>
          <div className="note" style={{ marginTop: 12 }}>
            For donor credibility, publish only reviewed materials and keep an audit trail of changes.
          </div>
        </section>

        <section className="card">
          <h2>Items</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Asset</th>
              </tr>
            </thead>
            <tbody>
              {m.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.order_index}</td>
                  <td>
                    {i.title}
                    {i.content_url ? (
                      <div className="muted" style={{ fontSize: 13 }}>
                        URL: <a href={i.content_url} target="_blank" rel="noreferrer">open</a>
                      </div>
                    ) : null}
                  </td>
                  <td><span className="badge">{i.type}</span></td>
                  <td>{i.is_published ? <span className="badge">Published</span> : <span className="badge">Draft</span>}</td>
                  <td>
                    {i.file_asset_id ? (
                      <a href={`/api/files/${i.file_asset_id}`}>Download</a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
