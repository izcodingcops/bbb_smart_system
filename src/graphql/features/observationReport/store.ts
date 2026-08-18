import {ObservationReport} from '../../../types/observationReport';
import {MOCK_OBSERVATION_REPORTS} from '../../../mocks/observationReport';

export const observationReportStore: {records: ObservationReport[]} = {
  records: MOCK_OBSERVATION_REPORTS,
};

export function findRecord(id: string): ObservationReport | undefined {
  return observationReportStore.records.find(r => r.id === id);
}

/**
 * One past the highest, unpadded — the seed tops out at `#OBR-3097`, so a
 * fresh form opens on the reference one past whatever the store currently
 * holds.
 */
export function nextReference(): string {
  const highest = observationReportStore.records.reduce((max, record) => {
    const n = Number(record.reference.replace('#OBR-', ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `#OBR-${highest + 1}`;
}
