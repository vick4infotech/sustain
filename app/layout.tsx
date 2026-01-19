import type { Metadata } from 'next';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SUSTAIN Platform (MVP)',
  description: 'Talent mobility and training platform (MVP)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
