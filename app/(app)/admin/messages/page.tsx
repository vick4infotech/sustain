import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listInbox } from '@/api/messages/messages';
import { listUsers } from '@/api/users/users';

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const inbox = listInbox(session.user.id);
  const users = listUsers();

  return (
    <div>
      <h1>Messages</h1>
      <p className="muted">
        Use messaging for programme coordination (talents, companies). All messages are recorded in the database and can be included in exports.
      </p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Unable to send message.</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            Error: <code>{sp.error}</code>
          </div>
        </div>
      ) : null}

      <div className="grid2">
        <section className="card">
          <h2>Compose</h2>
          <form method="POST" action="/api/messages/send" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <input type="hidden" name="returnTo" value="/admin/messages" />

            <label>
              Recipient
              <select name="recipientUserId" required>
                {users
                  .filter((u) => u.id !== session.user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.role})
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Subject
              <input name="subject" type="text" required />
            </label>

            <label>
              Message
              <textarea name="body" required />
            </label>

            <button className="btn" type="submit">Send</button>
          </form>
        </section>

        <section className="card">
          <h2>Inbox</h2>
          {inbox.length === 0 ? (
            <p className="muted">No messages yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inbox.map((m) => (
                  <tr key={m.id}>
                    <td>{m.sender_email}</td>
                    <td>
                      <strong>{m.subject}</strong>
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{m.body}</div>
                    </td>
                    <td>{m.sent_at}</td>
                    <td>
                      {m.read_at ? (
                        <span className="badge">Read</span>
                      ) : (
                        <form method="POST" action="/api/messages/read">
                          <input type="hidden" name="csrfToken" value={session.csrfToken} />
                          <input type="hidden" name="messageId" value={m.id} />
                          <input type="hidden" name="returnTo" value="/admin/messages" />
                          <button className="btn secondary" type="submit">Mark read</button>
                        </form>
                      )}
                    </td>
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
