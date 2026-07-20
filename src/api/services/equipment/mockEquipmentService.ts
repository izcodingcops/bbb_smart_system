import {MOCK_CHECKED_IN_EQUIPMENT} from '../../../mocks';
import {EquipmentServiceContract} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockEquipmentService = {
  getCheckedInEquipment: () =>
    delay({status: 200, data: MOCK_CHECKED_IN_EQUIPMENT}),
} satisfies EquipmentServiceContract;
