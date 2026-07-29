import {WorkItem} from '../../../types/work';
import {MOCK_WORK_ITEMS} from '../../../mocks/workItems';

/** Seeded once per app session; the status mutation edits this array in place. */
export const workStore: {items: WorkItem[]} = {
  items: MOCK_WORK_ITEMS.map(item => ({...item})),
};

export function findWorkItem(id: string): WorkItem | undefined {
  return workStore.items.find(item => item.id === id);
}
