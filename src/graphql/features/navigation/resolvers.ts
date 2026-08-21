import {MOCK_MENU_ITEMS, MOCK_USERS} from '../../../mocks';
import {MockContext, sleep, userIdForToken} from '../../mockSession';

const POSITION: Record<string, string> = {bottom: 'BOTTOM', more: 'MORE'};
const GROUP: Record<string, string> = {
  modules: 'MODULES',
  employee_shift: 'EMPLOYEE_SHIFT',
};

/**
 * Menu ids visible only to a supervisor account. First entry of its kind —
 * every other module ported so far renders identically for both roles (see
 * .claude/CLAUDE.md's User roles section), so this is filtered here rather
 * than with a per-row `roles` field on `MenuItem`: one set to check, no
 * schema change, and it stays a one-line addition if a second module needs
 * the same treatment.
 */
const SUPERVISOR_ONLY_IDS = new Set(['ambassadors']);

export const navigationResolvers = {
  Query: {
    menuItems: async (_p: unknown, _a: unknown, ctx: MockContext) => {
      await sleep();
      const user = MOCK_USERS.find(u => u.id === userIdForToken(ctx.token));
      const items =
        user?.role === 'supervisor'
          ? MOCK_MENU_ITEMS
          : MOCK_MENU_ITEMS.filter(item => !SUPERVISOR_ONLY_IDS.has(item.id));
      return items.map(item => ({
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
