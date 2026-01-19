import 'server-only';

export type Role = 'ADMIN' | 'TALENT' | 'COMPANY' | 'DONOR';
export type UserStatus = 'active' | 'pending' | 'suspended';

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
};

export type Session = {
  user: SessionUser;
  csrfToken: string;
  expiresAt: string;
};
