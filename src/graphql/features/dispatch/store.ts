import {DispatchDetail} from '../../../types/dispatch';
import {MOCK_DISPATCHES} from '../../../mocks/dispatch';

/**
 * Seeded once per app session. Nothing mutates it — Dispatch is read-only —
 * but it stays a store rather than a bare export so that wiring a real
 * transport later touches one file, exactly like the other features.
 */
export const dispatchStore: {records: DispatchDetail[]} = {
  records: MOCK_DISPATCHES,
};

export function findRecord(id: string): DispatchDetail | undefined {
  return dispatchStore.records.find(r => r.id === id);
}
