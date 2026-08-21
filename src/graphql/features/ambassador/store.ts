import {AmbassadorRecord, AmbassadorWork} from '../../../types/ambassador';
import {MOCK_AMBASSADORS, MOCK_AMBASSADOR_WORK} from '../../../mocks/ambassador';

export const ambassadorStore: {records: AmbassadorRecord[]} = {
  records: MOCK_AMBASSADORS,
};

export const ambassadorWorkStore: {records: AmbassadorWork[]} = {
  records: MOCK_AMBASSADOR_WORK,
};

export function findAmbassador(id: string): AmbassadorRecord | undefined {
  return ambassadorStore.records.find(r => r.id === id);
}

export function findAmbassadorWork(id: string): AmbassadorWork | undefined {
  return ambassadorWorkStore.records.find(r => r.id === id);
}
