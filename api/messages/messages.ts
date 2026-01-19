import 'server-only';

import { getDb } from '@/db/connection';
import type { Role } from '@/api/auth/types';

export type MessageRow = {
  id: number;
  sender_user_id: number;
  recipient_user_id: number;
  subject: string;
  body: string;
  sent_at: string;
  read_at: string | null;
};

export function listInbox(userId: number, limit = 100): Array<MessageRow & { sender_email: string }> {
  const db = getDb();
  return db
    .prepare(
      `SELECT m.id, m.sender_user_id, m.recipient_user_id, m.subject, m.body, m.sent_at, m.read_at,
              u.email as sender_email
       FROM messages m
       JOIN users u ON u.id = m.sender_user_id
       WHERE m.recipient_user_id = ?
       ORDER BY m.id DESC
       LIMIT ?`
    )
    .all(userId, limit) as any;
}

export function listSent(userId: number, limit = 100): Array<MessageRow & { recipient_email: string }> {
  const db = getDb();
  return db
    .prepare(
      `SELECT m.id, m.sender_user_id, m.recipient_user_id, m.subject, m.body, m.sent_at, m.read_at,
              u.email as recipient_email
       FROM messages m
       JOIN users u ON u.id = m.recipient_user_id
       WHERE m.sender_user_id = ?
       ORDER BY m.id DESC
       LIMIT ?`
    )
    .all(userId, limit) as any;
}

function companyCanMessageTalent(companyUserId: number, talentUserId: number): boolean {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.id
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE o.company_user_id = ? AND a.talent_user_id = ?
       LIMIT 1`
    )
    .get(companyUserId, talentUserId) as any;
  return Boolean(row);
}

function talentCanMessageCompany(talentUserId: number, companyUserId: number): boolean {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.id
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.talent_user_id = ? AND o.company_user_id = ?
       LIMIT 1`
    )
    .get(talentUserId, companyUserId) as any;
  return Boolean(row);
}

export function sendMessage(params: {
  sender: { id: number; role: Role };
  recipientUserId: number;
  subject: string;
  body: string;
}): { messageId: number } {
  const db = getDb();

  const recipient = db.prepare(`SELECT id, role FROM users WHERE id = ? LIMIT 1`).get(params.recipientUserId) as any;
  if (!recipient) throw new Error('RECIPIENT_NOT_FOUND');

  // Donors are read-only observers.
  if (params.sender.role === 'DONOR') throw new Error('FORBIDDEN');

  // Basic anti-spam constraints: only allow talent<->company messaging if an application exists.
  if (params.sender.role === 'COMPANY') {
    if (recipient.role === 'ADMIN') {
      // Allowed
    } else if (recipient.role === 'TALENT') {
      if (!companyCanMessageTalent(params.sender.id, params.recipientUserId)) {
        throw new Error('NO_RELATIONSHIP');
      }
    } else {
      throw new Error('FORBIDDEN');
    }
  }

  if (params.sender.role === 'TALENT') {
    if (recipient.role === 'ADMIN') {
      // Allowed
    } else if (recipient.role === 'COMPANY') {
      if (!talentCanMessageCompany(params.sender.id, params.recipientUserId)) {
        throw new Error('NO_RELATIONSHIP');
      }
    } else {
      throw new Error('FORBIDDEN');
    }
  }

  if (params.sender.role === 'ADMIN') {
    // Admin can message anyone.
  }

  const info = db
    .prepare(`INSERT INTO messages (sender_user_id, recipient_user_id, subject, body) VALUES (?, ?, ?, ?)`)
    .run(params.sender.id, params.recipientUserId, params.subject.trim(), params.body.trim());

  return { messageId: Number(info.lastInsertRowid) };
}

export function listMessagingRecipientsFor(senderUserId: number, senderRole: Role): Array<{ id: number; label: string }>{
  const db = getDb();

  if (senderRole === 'DONOR') {
    return [];
  }

  if (senderRole === 'ADMIN') {
    const rows = db
      .prepare(`SELECT id, email, role FROM users WHERE status = 'active' ORDER BY role, email`)
      .all() as any[];
    return rows
      .filter((r) => r.id !== senderUserId)
      .map((r) => ({ id: r.id, label: `${r.email} (${r.role})` }));
  }

  // Admins are always allowable.
  const admins = (db
    .prepare(`SELECT id, email FROM users WHERE role = 'ADMIN' AND status = 'active' ORDER BY email`)
    .all() as any[]).map((r) => ({ id: r.id, label: `${r.email} (ADMIN)` }));

  if (senderRole === 'TALENT') {
    const companies = db
      .prepare(
        `SELECT DISTINCT u.id, u.email
         FROM applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         JOIN users u ON u.id = o.company_user_id
         WHERE a.talent_user_id = ? AND u.status = 'active'
         ORDER BY u.email`
      )
      .all(senderUserId) as any[];
    return [...admins, ...companies.map((r) => ({ id: r.id, label: `${r.email} (COMPANY)` }))];
  }

  if (senderRole === 'COMPANY') {
    const talents = db
      .prepare(
        `SELECT DISTINCT u.id, u.email
         FROM opportunities o
         JOIN applications a ON a.opportunity_id = o.id
         JOIN users u ON u.id = a.talent_user_id
         WHERE o.company_user_id = ? AND u.status = 'active'
         ORDER BY u.email`
      )
      .all(senderUserId) as any[];
    return [...admins, ...talents.map((r) => ({ id: r.id, label: `${r.email} (TALENT)` }))];
  }

  return admins;
}

export function markMessageRead(params: { recipientUserId: number; messageId: number }) {
  const db = getDb();
  db.prepare(`UPDATE messages SET read_at = ? WHERE id = ? AND recipient_user_id = ?`).run(
    new Date().toISOString(),
    params.messageId,
    params.recipientUserId
  );
}
