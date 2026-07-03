import {MOCK_MENU_ITEMS} from '../../../constants';
import {MenuItem} from '../../../types/navigation';
import {NavigationServiceContract} from './contract';

const MOCK_DELAY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
}

export const mockNavigationService = {
  getMenuItems: () => delay({status: 200, data: MOCK_MENU_ITEMS as MenuItem[]}),
} satisfies NavigationServiceContract;
