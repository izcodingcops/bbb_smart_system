import {DispatchDetail} from '../../../types/dispatch';
import {MOCK_DISPATCHES} from '../../../mocks/dispatch';

/**
 * Seeded once per app session. Dispatches themselves are read-only; the one
 * thing that mutates is a dispatch's `incidents` array, via addIncident below.
 */
export const dispatchStore: {records: DispatchDetail[]} = {
  records: [...MOCK_DISPATCHES],
};

export function findRecord(id: string): DispatchDetail | undefined {
  return dispatchStore.records.find(r => r.id === id);
}

/**
 * One past the highest incident reference anywhere in the store — incident
 * references are global, unlike their `label`, which counts within a dispatch.
 */
export function nextIncidentReference(): string {
  const max = dispatchStore.records
    .flatMap(record => record.incidents)
    .reduce((acc, incident) => {
      const n = Number(incident.reference.replace('#', ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
  return `#${max + 1}`;
}
