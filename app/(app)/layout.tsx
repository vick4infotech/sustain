import Image from 'next/image';
import { redirect } from 'next/navigation';

import { getSession } from '@/api/auth/session';
import { appName } from '@/lib/env';

function navFor(role: string) {
  switch (role) {
    case 'ADMIN':
      return [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/training', label: 'Training' },
        { href: '/admin/opportunities', label: 'Opportunities' },
        { href: '/admin/messages', label: 'Messages' },
        { href: '/admin/reports', label: 'Reports' },
        { href: '/admin/audit', label: 'Audit log' },
      ];
    case 'TALENT':
      return [
        { href: '/talent', label: 'Dashboard' },
        { href: '/talent/profile', label: 'My profile' },
        { href: '/talent/learning', label: 'Learning' },
        { href: '/talent/opportunities', label: 'Opportunities' },
        { href: '/talent/applications', label: 'Applications' },
        { href: '/talent/messages', label: 'Messages' },
      ];
    case 'COMPANY':
      return [
        { href: '/company', label: 'Dashboard' },
        { href: '/company/profile', label: 'Company profile' },
        { href: '/company/opportunities', label: 'Opportunities' },
        { href: '/company/talent', label: 'Talent search' },
        { href: '/company/messages', label: 'Messages' },
      ];
    case 'DONOR':
      return [
        { href: '/donor', label: 'Dashboard' },
        { href: '/donor/reports', label: 'Reports' },
      ];
    default:
      return [];
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const links = navFor(session.user.role);

  return (
    <div className="container">
      <header className="header" aria-label="Programme header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Image src="/branding/logo.png" alt="Hicroft Technology" width={44} height={44} priority />
          </div>
          <div className="brand-title">
            <span className="kicker">Talent mobility & training programme</span>
            <strong>{appName()}</strong>
          </div>
        </div>

        <div className="userbar">
          <div className="muted" style={{ textAlign: 'right' }}>
            <div><span className="badge badge--role">{session.user.role}</span></div>
            <div style={{ fontSize: 13 }}>{session.user.email}</div>
          </div>
          <form method="POST" action="/api/auth/logout">
            <input type="hidden" name="csrfToken" value={session.csrfToken} />
            <button className="btn secondary btn--sm" type="submit">Log out</button>
          </form>
        </div>
      </header>

      <div style={{ height: 14 }} />

      {session.user.status !== 'active' ? (
        <div className="alert" role="alert">
          <strong>Account pending activation.</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            You can view this notice, but other sections may be restricted until an Admin activates your account.
          </div>
        </div>
      ) : null}

      <div style={{ height: 14 }} />

      <div className="app">
        <aside className="sidebar" aria-label="Primary navigation">
          <nav className="side-nav">
            {links.map((l) => (
              <a key={l.href} className="side-link" href={l.href}>{l.label}</a>
            ))}
            <a className="side-link muted" href="/api/health">System health</a>
          </nav>

          <div className="sidebar-footer">
            <div className="tiny">
              <strong>Brand-ready</strong>
              <div className="muted">Replace assets in <code>/public/branding</code>.</div>
            </div>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>

      <footer className="footer">
        <span>© {new Date().getFullYear()} — Programme-ready, audit-conscious MVP</span>
      </footer>
    </div>
  );
}
