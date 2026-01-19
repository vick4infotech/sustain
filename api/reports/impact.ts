import 'server-only';

import { getDb } from '@/db/connection';

export type ImpactSnapshot = {
  asOf: string;
  talentsActive: number;
  talentsPending: number;
  companiesActive: number;
  donorsActive: number;
  trainingModulesPublished: number;
  trainingItemsPublished: number;
  trainingCompletionsTotal: number;
  trainingCompletionRateAggregate: number; // 0..1
  opportunitiesOpen: number;
  applicationsTotal: number;
  placementsTotal: number;
  messagesLast30Days: number;
};

export function getImpactSnapshot(): ImpactSnapshot {
  const db = getDb();
  const asOf = new Date().toISOString();

  const talentsActive = Number((db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='TALENT' AND status='active'`).get() as any).c);
  const talentsPending = Number((db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='TALENT' AND status='pending'`).get() as any).c);
  const companiesActive = Number((db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='COMPANY' AND status='active'`).get() as any).c);
  const donorsActive = Number((db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='DONOR' AND status='active'`).get() as any).c);

  const trainingModulesPublished = Number((db.prepare(`SELECT COUNT(*) as c FROM training_modules WHERE is_published=1`).get() as any).c);
  const trainingItemsPublished = Number((db.prepare(`SELECT COUNT(*) as c FROM training_items WHERE is_published=1`).get() as any).c);

  const trainingCompletionsTotal = Number((db.prepare(`SELECT COUNT(*) as c FROM talent_item_progress WHERE status='completed'`).get() as any).c);

  const denom = talentsActive * trainingItemsPublished;
  const trainingCompletionRateAggregate = denom > 0 ? trainingCompletionsTotal / denom : 0;

  const opportunitiesOpen = Number((db.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE status='open'`).get() as any).c);
  const applicationsTotal = Number((db.prepare(`SELECT COUNT(*) as c FROM applications`).get() as any).c);
  const placementsTotal = Number((db.prepare(`SELECT COUNT(*) as c FROM applications WHERE status='hired'`).get() as any).c);

  const messagesLast30Days = Number(
    (db
      .prepare(`SELECT COUNT(*) as c FROM messages WHERE sent_at >= datetime('now','-30 day')`)
      .get() as any).c
  );

  return {
    asOf,
    talentsActive,
    talentsPending,
    companiesActive,
    donorsActive,
    trainingModulesPublished,
    trainingItemsPublished,
    trainingCompletionsTotal,
    trainingCompletionRateAggregate,
    opportunitiesOpen,
    applicationsTotal,
    placementsTotal,
    messagesLast30Days,
  };
}
