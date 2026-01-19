import { appName } from '@/lib/env';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error;

  return (
    <div className="grid">
      <section className="card">
        <h1>Log in</h1>
        <p className="muted">
          Access the {appName()} platform as Admin, Talent, Company, or Donor.
        </p>

        {error ? (
          <div className="alert" role="alert">
            <strong>Unable to log in.</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              Error: <code>{error}</code>
            </div>
          </div>
        ) : null}

        <form method="POST" action="/api/auth/login" className="form">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn" type="submit">Log in</button>
        </form>

        <div style={{ marginTop: 12 }} className="muted">
          Talent first time here? <a href="/signup">Create your profile</a>.
        </div>
      </section>

      <aside className="card" aria-label="Why this platform">
        <h2>Why this platform exists</h2>
        <ul className="list">
          <li><strong>Transparency</strong> — consistent tracking of training and placements.</li>
          <li><strong>Donor trust</strong> — dashboards + exportable reports.</li>
          <li><strong>Employer engagement</strong> — structured opportunities and messaging.</li>
          <li><strong>Audit readiness</strong> — key actions recorded in an audit log.</li>
        </ul>
        <div className="note">
          <strong>Branding note:</strong> All visual assets are placeholders in <code>/public/branding</code>.
        </div>
      </aside>
    </div>
  );
}
