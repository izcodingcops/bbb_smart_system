import {IncidentDetail} from '../../../types/incident';
import {MOCK_INCIDENTS} from '../../../mocks/incident';

/** Seeded once per app session; mutations edit this array in place. */
export const incidentStore: {records: IncidentDetail[]} = {
  records: MOCK_INCIDENTS.map(record => ({...record})),
};

export function findRecord(id: string): IncidentDetail | undefined {
  return incidentStore.records.find(r => r.id === id);
}

/** One past the highest existing number — one global counter, regardless of entry point. */
export function nextReference(): string {
  const max = incidentStore.records.reduce((acc, r) => {
    const n = Number(r.reference.replace('#IN-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#IN-${max + 1}`;
}
