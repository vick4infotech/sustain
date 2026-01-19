import { redirect } from 'next/navigation';

import { requireSession } from '@/api/auth/session';
import { searchTalentsForCompany } from '@/api/talent/profile';

export default async function CompanyTalentSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; skill?: string }>;
}) {
  const session = await requireSession(['COMPANY']);
  if (session.user.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const keyword = (sp.keyword || '').trim();
  const skill = (sp.skill || '').trim();

  const results = searchTalentsForCompany({
    query: keyword || undefined,
    skill: skill || undefined,
  });

  return (
    <div>
      <h1>Search talent</h1>
      <p className="muted">Only talents who opted in to be visible are shown. Contact details are not displayed.</p>

      <section className="card">
        <h2>Filters</h2>
        <form method="GET" className="form">
          <label>
            Keyword (name, headline)
            <input name="keyword" type="text" defaultValue={keyword} placeholder="e.g. nurse, data analyst, logistics" />
          </label>

          <label>
            Skill
            <input name="skill" type="text" defaultValue={skill} placeholder="e.g. Excel, JavaScript, German" />
          </label>

          <button className="btn" type="submit">Search</button>
        </form>
      </section>

      <section className="card">
        <h2>Results</h2>
        {results.length === 0 ? (
          <p className="muted">No matching talent profiles.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Talent</th>
                <th>Headline</th>
                <th>Location</th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.userId}>
                  <td><a href={`/company/talent/${r.userId}`}>{r.displayName}</a></td>
                  <td>{r.headline || <span className="muted">—</span>}</td>
                  <td>{r.locationCountry || <span className="muted">—</span>}</td>
                  <td>{r.skills.slice(0, 6).join(', ') || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
