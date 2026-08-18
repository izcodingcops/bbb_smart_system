import {OffHoursVisit} from '../../../types/offHoursVisit';
import {MOCK_OFF_HOURS_VISITS} from '../../../mocks/offHoursVisit';

/**
 * Seeded once per app session; the create mutation unshifts into this array.
 *
 * Nothing reads it back — this module has no list or detail query. It exists
 * so the reference sequence has a high-water mark to advance from, and so a
 * submitted report behaves like one a real gateway would have stored.
 */
export const offHoursVisitStore: {records: OffHoursVisit[]} = {
  records: MOCK_OFF_HOURS_VISITS,
};

/** One past the highest existing number. */
export function nextReference(): string {
  const highest = offHoursVisitStore.records.reduce((acc, record) => {
    const n = Number(record.reference.replace('#OHV-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#OHV-${highest + 1}`;
}
