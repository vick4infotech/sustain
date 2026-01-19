import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getTalentModule } from '@/api/training/training';

export default async function TalentModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['TALENT']);
  if (session.user.status !== 'active') redirect('/pending');

  const p = await params;
  const sp = await searchParams;
  const moduleId = Number(p.moduleId || 0);
  if (!moduleId) redirect('/talent/learning');

  const data = getTalentModule({ moduleId, talentUserId: session.user.id });
  if (!data) redirect('/talent/learning');

  return (
    <div>
      <h1>{data.module.title}</h1>
      <p className="muted">{data.module.description}</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Action failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <section className="card">
        <h2>Items</h2>
        {data.items.length === 0 ? <p className="muted">No items yet.</p> : null}

        {data.items.map((i) => (
          <article key={i.id} className="notice" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong>{i.title}</strong>
                <div className="muted" style={{ fontSize: 13 }}>{i.type}</div>
              </div>
              <div>
                {i.progressStatus === 'completed' ? (
                  <span className="badge">Completed</span>
                ) : (
                  <form method="POST" action="/api/talent/training/complete">
                    <input type="hidden" name="csrfToken" value={session.csrfToken} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="itemId" value={i.id} />
                    <button className="btn secondary" type="submit">Mark complete</button>
                  </form>
                )}
              </div>
            </div>

            {i.body_text ? (
              <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{i.body_text}</div>
            ) : null}

            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {i.content_url ? (
                <a className="btn secondary" href={i.content_url} target="_blank" rel="noreferrer">Open link</a>
              ) : null}
              {i.file_asset_id ? (
                <a className="btn secondary" href={`/api/files/${i.file_asset_id}`}>Download file</a>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        Completion data is used in aggregate impact reporting to donors.
      </div>
    </div>
  );
}
