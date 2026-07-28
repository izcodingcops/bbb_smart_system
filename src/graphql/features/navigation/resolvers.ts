import {MOCK_MENU_ITEMS} from '../../../mocks';
import {sleep} from '../../mockSession';

const POSITION: Record<string, string> = {bottom: 'BOTTOM', more: 'MORE'};
const GROUP: Record<string, string> = {
  modules: 'MODULES',
  employee_shift: 'EMPLOYEE_SHIFT',
};

export const navigationResolvers = {
  Query: {
    menuItems: async () => {
      await sleep();
      return MOCK_MENU_ITEMS.map(item => ({
        id: item.id,
        menuName: item.menu_name,
        screenName: item.screen_name,
        menuIcon: item.menu_icon,
        position: POSITION[item.position],
        menuGroup: item.menu_group ? GROUP[item.menu_group] : null,
      }));
    },
  },
};
