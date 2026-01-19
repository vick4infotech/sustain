import { appName } from '@/lib/env';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error;

  return (
    <div className="grid">
      <section className="card">
        <h1>Talent sign-up</h1>
        <p className="muted">
          Create an account and begin building a profile similar to a
          LinkedIn profile: headline, skills, experience, education, and links.
        </p>

        {error ? (
          <div className="alert" role="alert">
            <strong>Unable to create account.</strong>
            <div className="muted" style={{ marginTop: 6 }}>
              Error: <code>{error}</code>
            </div>
          </div>
        ) : null}

        <form method="POST" action="/api/auth/signup" className="form">
          <label>
            Full name
            <input name="fullName" type="text" autoComplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={10} required />
            <span className="muted" style={{ fontSize: 13 }}>
              Use a long passphrase. Minimum 10 characters.
            </span>
          </label>
          <label>
            Programme access code <span className="muted">(if required)</span>
            <input name="accessCode" type="text" autoComplete="one-time-code" />
          </label>

          <button className="btn" type="submit">Create account</button>
        </form>

        <div style={{ marginTop: 12 }} className="muted">
          Already have an account? <a href="/login">Log in</a>.
        </div>
      </section>

      <aside className="card" aria-label="What happens next">
        <h2>What happens next</h2>
        <ol className="list">
          <li>Your account is created in <strong>pending</strong> status.</li>
          <li>An Admin reviews and activates your account.</li>
          <li>Once active, you can complete your profile, learn, and apply to opportunities.</li>
        </ol>
        <div className="note">
          <strong>Privacy:</strong> Employers view limited profile details; emails are not shown to companies.
        </div>
      </aside>
    </div>
  );
}
