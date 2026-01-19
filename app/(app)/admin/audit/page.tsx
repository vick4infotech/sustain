import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listAuditEvents } from '@/api/audit/audit';

export default async function AdminAuditPage() {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const events = listAuditEvents(200);

  return (
    <div>
      <h1>Audit log</h1>
      <p className="muted">Evidence for governance: who did what, and when.</p>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.created_at}</td>
                <td>{e.actor_email || <span className="muted">(system)</span>}</td>
                <td><span className="badge">{e.action}</span></td>
                <td>{e.entity_type}:{e.entity_id}</td>
                <td><code style={{ fontSize: 12 }}>{e.metadata_json || ''}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="note" style={{ marginTop: 12 }}>
        <strong>Policy note:</strong> This MVP captures key events for donor confidence and operational traceability. In production, define a retention policy and export procedure.
      </div>
    </div>
  );
}
