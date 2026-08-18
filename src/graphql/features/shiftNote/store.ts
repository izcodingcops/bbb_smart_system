import {ShiftNote} from '../../../types/shiftNote';
import {MOCK_SHIFT_NOTES} from '../../../mocks/shiftNote';

/**
 * Seeded once per app session; the create mutation unshifts into this array.
 *
 * Nothing reads it back — this module has no list or detail query. It exists so
 * the reference sequence has a high-water mark to advance from, and so a
 * submitted note behaves like one a real gateway would have stored.
 */
export const shiftNoteStore: {records: ShiftNote[]} = {
  records: MOCK_SHIFT_NOTES,
};

/** Width of the reference's numeric part — '#SHN-0442', not '#SHN-442'. */
const REFERENCE_DIGITS = 4;

/** One past the highest existing number, zero-padded as the design shows. */
export function nextReference(): string {
  const highest = shiftNoteStore.records.reduce((acc, record) => {
    const n = Number(record.reference.replace('#SHN-', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#SHN-${String(highest + 1).padStart(REFERENCE_DIGITS, '0')}`;
}
