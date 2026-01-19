import 'server-only';

import { getDb } from '@/db/connection';

export type AuditAction =
  | 'BOOTSTRAP_ADMIN'
  | 'LOGIN_SUCCESS'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'ACTIVATE_USER'
  | 'SUSPEND_USER'
  | 'GENERATE_INVITE'
  | 'SET_PASSWORD_FROM_INVITE'
  | 'CREATE_TRAINING_MODULE'
  | 'CREATE_TRAINING_ITEM'
  | 'UPLOAD_FILE'
  | 'MARK_ITEM_COMPLETE'
  | 'CREATE_OPPORTUNITY'
  | 'APPLY_OPPORTUNITY'
  | 'UPDATE_APPLICATION_STATUS'
  | 'SEND_MESSAGE'
  | 'UPDATE_TALENT_PROFILE'
  | 'UPDATE_COMPANY_PROFILE'
  | 'EXPORT_IMPACT_REPORT';

export type AuditEntityType =
  | 'USER'
  | 'SESSION'
  | 'TRAINING_MODULE'
  | 'TRAINING_ITEM'
  | 'FILE_ASSET'
  | 'OPPORTUNITY'
  | 'APPLICATION'
  | 'MESSAGE'
  | 'REPORT';

export function recordAuditEvent(params: {
  actorUserId: number | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | number | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_events (actor_user_id, action, entity_type, entity_id, metadata_json, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    params.actorUserId,
    params.action,
    params.entityType,
    params.entityId === undefined || params.entityId === null ? null : String(params.entityId),
    params.metadata ? JSON.stringify(params.metadata) : null,
    params.ipAddress || null,
    params.userAgent || null
  );
}

export type AuditEventRow = {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata_json: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export function listAuditEvents(limit = 100): AuditEventRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, actor_user_id, action, entity_type, entity_id, metadata_json, ip_address, user_agent, created_at
       FROM audit_events
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(limit) as AuditEventRow[];
}
