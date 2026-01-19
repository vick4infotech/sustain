import Image from 'next/image';

import { appName } from '@/lib/env';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <header className="header header--public" aria-label="Programme header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Image
              src="/branding/logo.png"
              alt="Hicroft Technology"
              width={44}
              height={44}
              priority
            />
          </div>
          <div className="brand-title">
            <span className="kicker">Talent mobility & training platform</span>
            <strong>{appName()}</strong>
          </div>
        </div>

        <nav className="topnav" aria-label="Public navigation">
          <a className="nav-link" href="/login">Log in</a>
          <a className="btn btn--sm" href="/signup">Create account</a>
        </nav>
      </header>

      <div style={{ height: 18 }} />
      <main>{children}</main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} — Programme-ready, white-label MVP</span>
      </footer>
    </div>
  );
}
