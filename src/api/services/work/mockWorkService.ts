import {MOCK_QUICK_ACTIONS, MOCK_WORK_ITEMS} from '../../../mocks';
import {WorkServiceContract} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockWorkService = {
  getWorkItems: () => delay({status: 200, data: MOCK_WORK_ITEMS}),
  getQuickActions: () => delay({status: 200, data: MOCK_QUICK_ACTIONS}),
} satisfies WorkServiceContract;
