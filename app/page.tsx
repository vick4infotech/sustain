import { redirect } from 'next/navigation';

import { getSession } from '@/api/auth/session';

export default async function IndexPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.user.status !== 'active') {
    redirect('/pending');
  }

  switch (session.user.role) {
    case 'ADMIN':
      redirect('/admin');
    case 'TALENT':
      redirect('/talent');
    case 'COMPANY':
      redirect('/company');
    case 'DONOR':
      redirect('/donor');
    default:
      redirect('/login');
  }
}
