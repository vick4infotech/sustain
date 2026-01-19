import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { listUsers } from '@/api/users/users';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string }>;
}) {
  const session = await requireSession(['ADMIN']);
  if (session.user.status !== 'active') redirect('/pending');
  const sp = await searchParams;
  const users = listUsers();

  return (
    <div>
      <h1>Users</h1>
      <p className="muted">
        Create and manage accounts for talents, companies, donors, and administrators.
        For security, Admins never set passwords; they generate one-time invite links.
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
          <h2>Create user</h2>
          <form method="POST" action="/api/admin/users/create" className="form">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <div className="row">
              <label>
                Role
                <select name="role" defaultValue="TALENT">
                  <option value="ADMIN">Admin</option>
                  <option value="TALENT">Talent</option>
                  <option value="COMPANY">Company</option>
                  <option value="DONOR">Donor</option>
                </select>
              </label>
              <label>
                Initial status
                <select name="status" defaultValue="active">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>

            <div className="row">
              <label>
                Talent full name <span className="muted">(if Talent)</span>
                <input name="fullName" type="text" />
              </label>
              <label>
                Company name <span className="muted">(if Company)</span>
                <input name="companyName" type="text" />
              </label>
            </div>

            <button className="btn" type="submit">Create</button>
          </form>
          <div className="note" style={{ marginTop: 12 }}>
            After creating a user, click <strong>Generate invite</strong> to produce a one-time password setup link.
          </div>
        </section>

        <section className="card">
          <h2>Existing users</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.role}</span></td>
                  <td>{u.status}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <form method="POST" action="/api/admin/users/status">
                        <input type="hidden" name="csrfToken" value={session.csrfToken} />
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="status" defaultValue={u.status}>
                          <option value="active">active</option>
                          <option value="pending">pending</option>
                          <option value="suspended">suspended</option>
                        </select>
                        <button className="btn secondary" type="submit">Update</button>
                      </form>

                      <form method="POST" action="/api/admin/users/invite">
                        <input type="hidden" name="csrfToken" value={session.csrfToken} />
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="btn secondary" type="submit">Generate invite</button>
                      </form>
                    </div>
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
