import {PoiRecord} from '../../../types/poi';
import {MOCK_POIS} from '../../../mocks/poi';

export type {PoiRecord};

/** Seeded once per app session; mutations edit this array in place. */
export const poiStore: {records: PoiRecord[]} = {records: MOCK_POIS};

export function findRecord(id: string): PoiRecord | undefined {
  return poiStore.records.find(r => r.id === id);
}

/** One past the highest existing number, so created records sort to the top. */
function nextNumber(values: string[], prefix: string): number {
  return (
    values.reduce((acc, value) => {
      const n = Number(value.replace(prefix, ''));
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0) + 1
  );
}

export function nextPersonReference(): string {
  const references = poiStore.records.map(r => r.reference);
  return `#POI-${nextNumber(references, '#POI-')}`;
}

/**
 * Interaction and update references are module-wide rather than per-person —
 * the export's own '#INT-9007' implies a single sequence — so both generators
 * scan every person's timeline for the high-water mark.
 */
export function nextInteractionReference(): string {
  const references = poiStore.records.flatMap(r =>
    r.interactions.map(i => i.reference),
  );
  return `#INT-${nextNumber(references, '#INT-')}`;
}

export function nextUpdateReference(): string {
  const references = poiStore.records.flatMap(r =>
    r.updates.map(u => u.reference),
  );
  return `#UPD-${nextNumber(references, '#UPD-')}`;
}
