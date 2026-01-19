import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { getCompanyProfile } from '@/api/users/companyProfile';

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const p = getCompanyProfile(session.user.id);

  return (
    <div className="card">
      <h1>Company profile</h1>
      <p className="muted">Used to reassure talents and donors that opportunities come from verified partners.</p>

      {sp.error ? (
        <div className="alert" role="alert">
          <strong>Update failed.</strong>
          <div className="muted" style={{ marginTop: 6 }}>Error: <code>{sp.error}</code></div>
        </div>
      ) : null}
      {sp.updated ? <div className="note">Saved.</div> : null}

      <form method="POST" action="/api/company/profile" className="form">
        <input type="hidden" name="csrfToken" value={session.csrfToken} />

        <label>
          Company name
          <input name="companyName" type="text" defaultValue={p.companyName} required />
        </label>

        <label>
          Sector
          <input name="sector" type="text" defaultValue={p.sector} placeholder="e.g. logistics, ICT, renewable energy" />
        </label>

        <label>
          Website
          <input name="website" type="url" defaultValue={p.website} placeholder="https://..." />
        </label>

        <label>
          Headquarters
          <input name="hqLocation" type="text" defaultValue={p.hqLocation} placeholder="City, Country" />
        </label>

        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  );
}
