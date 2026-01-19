import 'server-only';

import { getDb } from '@/db/connection';

export type TrainingItemType = 'LECTURE' | 'VIDEO' | 'DOCUMENT';

export type TrainingModuleRow = {
  id: number;
  title: string;
  description: string;
  is_published: number;
  created_at: string;
};

export type TrainingItemRow = {
  id: number;
  module_id: number;
  type: TrainingItemType;
  title: string;
  body_text: string | null;
  content_url: string | null;
  file_asset_id: number | null;
  order_index: number;
  is_published: number;
};

export function listAdminModules(): TrainingModuleRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, title, description, is_published, created_at
       FROM training_modules
       ORDER BY id DESC`
    )
    .all() as TrainingModuleRow[];
}

export function getAdminModule(moduleId: number): { module: TrainingModuleRow; items: TrainingItemRow[] } | null {
  const db = getDb();
  const m = db
    .prepare(`SELECT id, title, description, is_published, created_at FROM training_modules WHERE id = ? LIMIT 1`)
    .get(moduleId) as any;
  if (!m) return null;
  const items = db
    .prepare(
      `SELECT id, module_id, type, title, body_text, content_url, file_asset_id, order_index, is_published
       FROM training_items
       WHERE module_id = ?
       ORDER BY order_index ASC, id ASC`
    )
    .all(moduleId) as TrainingItemRow[];
  return { module: m as TrainingModuleRow, items };
}

export function createModule(params: {
  adminUserId: number;
  title: string;
  description: string;
  isPublished: boolean;
}): { moduleId: number } {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO training_modules (title, description, is_published, created_by_admin_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      params.title.trim(),
      params.description.trim(),
      params.isPublished ? 1 : 0,
      params.adminUserId,
      new Date().toISOString(),
      new Date().toISOString()
    );
  return { moduleId: Number(info.lastInsertRowid) };
}

export function createItem(params: {
  adminUserId: number;
  moduleId: number;
  type: TrainingItemType;
  title: string;
  bodyText?: string;
  contentUrl?: string;
  fileAssetId?: number | null;
  orderIndex?: number;
  isPublished: boolean;
}): { itemId: number } {
  const db = getDb();

  const order = params.orderIndex ?? 1000;

  const info = db
    .prepare(
      `INSERT INTO training_items (module_id, type, title, body_text, content_url, file_asset_id, order_index, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      params.moduleId,
      params.type,
      params.title.trim(),
      (params.bodyText || '').trim() || null,
      (params.contentUrl || '').trim() || null,
      params.fileAssetId ?? null,
      order,
      params.isPublished ? 1 : 0
    );

  return { itemId: Number(info.lastInsertRowid) };
}

export type TalentModuleListCard = {
  id: number;
  title: string;
  description: string;
  totalItems: number;
  completedItems: number;
};

export function listPublishedModulesForTalent(talentUserId: number): TalentModuleListCard[] {
  const db = getDb();

  const modules = db
    .prepare(
      `SELECT id, title, description
       FROM training_modules
       WHERE is_published = 1
       ORDER BY id DESC`
    )
    .all() as any[];

  const cards: TalentModuleListCard[] = [];

  for (const m of modules) {
    const totalItems = Number(
      (db
        .prepare(
          `SELECT COUNT(*) as c
           FROM training_items
           WHERE module_id = ? AND is_published = 1`
        )
        .get(m.id) as any).c
    );

    const completedItems = Number(
      (db
        .prepare(
          `SELECT COUNT(*) as c
           FROM talent_item_progress p
           JOIN training_items i ON i.id = p.training_item_id
           WHERE p.talent_user_id = ? AND p.status = 'completed' AND i.module_id = ? AND i.is_published = 1`
        )
        .get(talentUserId, m.id) as any).c
    );

    cards.push({
      id: m.id,
      title: m.title,
      description: m.description,
      totalItems,
      completedItems,
    });
  }

  return cards;
}

/**
 * High-level learning summary used by the Talent dashboard.
 */
export function getTalentLearningSummary(talentUserId: number): { totalItems: number; completedItems: number } {
  const db = getDb();
  const totalItems = Number(
    (db
      .prepare(
        `SELECT COUNT(*) as c
         FROM training_items i
         JOIN training_modules m ON m.id = i.module_id
         WHERE m.is_published = 1 AND i.is_published = 1`
      )
      .get() as any).c
  );
  const completedItems = Number(
    (db
      .prepare(
        `SELECT COUNT(*) as c
         FROM talent_item_progress p
         JOIN training_items i ON i.id = p.training_item_id
         JOIN training_modules m ON m.id = i.module_id
         WHERE p.talent_user_id = ? AND p.status = 'completed'
           AND m.is_published = 1 AND i.is_published = 1`
      )
      .get(talentUserId) as any).c
  );
  return { totalItems, completedItems };
}

export type TalentTrainingItem = TrainingItemRow & { progressStatus: 'not_started' | 'completed'; completedAt: string | null };

export function getTalentModule(params: {
  moduleId: number;
  talentUserId: number;
}): { module: TrainingModuleRow; items: TalentTrainingItem[] } | null {
  const db = getDb();
  const m = db
    .prepare(
      `SELECT id, title, description, is_published, created_at
       FROM training_modules
       WHERE id = ? AND is_published = 1
       LIMIT 1`
    )
    .get(params.moduleId) as any;
  if (!m) return null;

  const items = db
    .prepare(
      `SELECT id, module_id, type, title, body_text, content_url, file_asset_id, order_index, is_published
       FROM training_items
       WHERE module_id = ? AND is_published = 1
       ORDER BY order_index ASC, id ASC`
    )
    .all(params.moduleId) as TrainingItemRow[];

  const progressRows = db
    .prepare(
      `SELECT training_item_id, status, completed_at
       FROM talent_item_progress
       WHERE talent_user_id = ? AND training_item_id IN (${items.map(() => '?').join(',') || 'NULL'})`
    )
    .all(params.talentUserId, ...items.map((i) => i.id)) as any[];

  const map = new Map<number, { status: string; completed_at: string | null }>();
  for (const r of progressRows) {
    map.set(r.training_item_id, { status: r.status, completed_at: r.completed_at || null });
  }

  const enriched: TalentTrainingItem[] = items.map((i) => {
    const p = map.get(i.id);
    const isCompleted = p?.status === 'completed';
    return {
      ...i,
      progressStatus: isCompleted ? 'completed' : 'not_started',
      completedAt: isCompleted ? p?.completed_at || null : null,
    };
  });

  return { module: m as TrainingModuleRow, items: enriched };
}

export function markItemComplete(params: { talentUserId: number; trainingItemId: number }) {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO talent_item_progress (talent_user_id, training_item_id, status, completed_at, updated_at)
     VALUES (?, ?, 'completed', ?, ?)
     ON CONFLICT(talent_user_id, training_item_id)
     DO UPDATE SET status = 'completed', completed_at = excluded.completed_at, updated_at = excluded.updated_at`
  ).run(params.talentUserId, params.trainingItemId, now, now);
}

export function isFileAssetVisibleToTalent(params: { fileAssetId: number; talentUserId: number }): boolean {
  const db = getDb();
  // Talent can only access files attached to published training items.
  const row = db
    .prepare(
      `SELECT i.id
       FROM training_items i
       JOIN training_modules m ON m.id = i.module_id
       WHERE i.file_asset_id = ? AND i.is_published = 1 AND m.is_published = 1
       LIMIT 1`
    )
    .get(params.fileAssetId) as any;
  return Boolean(row);
}
