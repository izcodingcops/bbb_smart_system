import {WorkLogEntry} from '../../../types/workLog';
import {MOCK_WORK_LOG_ENTRIES} from '../../../mocks/workLog';

/** Seeded once per app session; mutations edit this array in place. */
export const workLogStore: {records: WorkLogEntry[]} = {
  records: MOCK_WORK_LOG_ENTRIES.map(entry => ({...entry})),
};

export function findRecord(id: string): WorkLogEntry | undefined {
  return workLogStore.records.find(r => r.id === id);
}

/** One past the highest existing reference number, so created records sort to the top. */
export function nextReference(): string {
  const max = workLogStore.records.reduce((acc, r) => {
    const n = Number(r.reference.replace('#', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#${max + 1}`;
}
