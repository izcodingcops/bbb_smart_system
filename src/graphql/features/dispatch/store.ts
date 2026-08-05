import {DispatchDetail} from '../../../types/dispatch';
import {MOCK_DISPATCHES} from '../../../mocks/dispatch';

/** Seeded once per app session. Dispatches are read-only. */
export const dispatchStore: {records: DispatchDetail[]} = {
  records: [...MOCK_DISPATCHES],
};

export function findRecord(id: string): DispatchDetail | undefined {
  return dispatchStore.records.find(r => r.id === id);
}
