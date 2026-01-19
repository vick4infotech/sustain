import { peekInvite } from '@/api/auth/auth';
import { appName } from '@/lib/env';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const token = p.token;
  const error = sp.error;

  const info = peekInvite({ token });

  return (
    <div className="grid">
      <section className="card">
        <h1>Set your password</h1>
        <p className="muted">
          You have been invited to access {appName()}. This link can be used once.
        </p>

        {error ? (
          <div className="alert" role="alert">
            <strong>Unable to complete invite.</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              Error: <code>{error}</code>
            </div>
          </div>
        ) : null}

        {!info ? (
          <div className="alert" role="alert">
            <strong>Invite link is invalid or expired.</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              Ask an Admin to generate a new invite.
            </div>
          </div>
        ) : (
          <>
            <div className="note">
              <div>
                <strong>Account:</strong> {info.userEmail}
              </div>
              <div>
                <strong>Role:</strong> {info.role}
              </div>
              <div>
                <strong>Expires:</strong> {info.expiresAt}
              </div>
            </div>

            <form method="POST" action="/api/auth/invite/complete" className="form">
              <input type="hidden" name="token" value={token} />
              <label>
                New password
                <input name="password" type="password" autoComplete="new-password" minLength={10} required />
                <span className="muted" style={{ fontSize: 13 }}>
                  Use a long passphrase. Minimum 10 characters.
                </span>
              </label>
              <button className="btn" type="submit">Activate account</button>
            </form>
          </>
        )}

        <div style={{ marginTop: 12 }} className="muted">
          <a href="/login">Back to log in</a>
        </div>
      </section>

      <aside className="card" aria-label="Security guidance">
        <h2>Security guidance</h2>
        <ul className="list">
          <li>Invite links are one-time and expire automatically.</li>
          <li>Do not forward invite links in public channels.</li>
          <li>If you suspect misuse, request a new invite from Admin.</li>
        </ul>
      </aside>
    </div>
  );
}
