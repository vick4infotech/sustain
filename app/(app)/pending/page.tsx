import { redirect } from 'next/navigation';

import { getSession } from '@/api/auth/session';

export default async function PendingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.user.status === 'active') redirect('/');

  return (
    <div className="card">
      <h1>Account pending activation</h1>
      <p className="muted">
        Your account exists, but an Admin must activate it before you can access training content and opportunities.
      </p>
      <div className="notice warn" role="status">
        <strong>What you can do now:</strong>
        <ul className="list">
          <li>Confirm you used the correct email address.</li>
          <li>Wait for an Admin to activate your account.</li>
          <li>If you have questions, contact the programme team through your normal channels.</li>
        </ul>
      </div>
    </div>
  );
}
