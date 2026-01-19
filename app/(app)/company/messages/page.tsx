import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listInbox, listMessagingRecipientsFor } from '@/api/messages/messages';

export default async function CompanyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const inbox = listInbox(session.user.id);
  const recipients = listMessagingRecipientsFor(session.user.id, session.user.role);

  return (
    <div>
      <h1>Messages</h1>
      <p className="muted">Communicate with the programme team and relevant talents.</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Message failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}

      <div className="grid2">
        <section className="card">
          <h2>Send message</h2>
          {recipients.length === 0 ? (
            <p className="muted">No eligible recipients yet. After receiving applications, you can message talents here. You can always message Admins.</p>
          ) : (
            <form method="POST" action="/api/messages/send" className="form">
              <input type="hidden" name="csrfToken" value={session.csrfToken} />
              <input type="hidden" name="returnTo" value="/company/messages" />

              <label>
                Recipient
                <select name="recipientUserId" required>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
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
          )}
        </section>

        <section className="card">
          <h2>Inbox</h2>
          {inbox.length === 0 ? (
            <p className="muted">No messages.</p>
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
                      <div className="muted" style={{ fontSize: 13 }}>{m.body.slice(0, 140)}{m.body.length > 140 ? '…' : ''}</div>
                    </td>
                    <td>{m.sent_at}</td>
                    <td>
                      {m.read_at ? (
                        <span className="muted">Read</span>
                      ) : (
                        <form method="POST" action="/api/messages/read">
                          <input type="hidden" name="csrfToken" value={session.csrfToken} />
                          <input type="hidden" name="messageId" value={m.id} />
                          <input type="hidden" name="returnTo" value="/company/messages" />
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
