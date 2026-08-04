import {DispatchDetail, DispatchIncident} from '../../../types/dispatch';
import {MOCK_DISPATCHES} from '../../../mocks/dispatch';

/**
 * Seeded once per app session. Dispatches themselves are read-only; the one
 * thing that mutates is a dispatch's `incidents` array, via addIncident below.
 *
 * `incidents` is cloned per record rather than spread as-is: most seed
 * records share one empty array by reference (MOCK_DISPATCHES' default
 * spreads the same `[]` literal onto every dispatch that doesn't set its
 * own), so pushing onto one dispatch's incidents would otherwise push onto
 * every other default dispatch's incidents too.
 */
export const dispatchStore: {records: DispatchDetail[]} = {
  records: MOCK_DISPATCHES.map(record => ({
    ...record,
    incidents: [...record.incidents],
  })),
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

/**
 * Appends onto the parent's incidents array in place, and returns the record
 * so the resolver can wire it straight back. Undefined when the parent is
 * gone — the resolver turns that into a GraphQL error rather than a silent
 * no-op.
 */
export function addIncident(
  dispatchId: string,
  incident: DispatchIncident,
): DispatchIncident | undefined {
  const parent = findRecord(dispatchId);
  if (!parent) {
    return undefined;
  }
  parent.incidents.push(incident);
  return incident;
}
