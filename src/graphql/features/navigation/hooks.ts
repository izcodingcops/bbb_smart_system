import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {MenuGroup, MenuItem} from '../../../types/navigation';
import {GET_MENU_ITEMS} from './documents';

interface GqlMenuItem {
  id: string;
  menuName: string;
  screenName: string;
  menuIcon: string;
  position: 'BOTTOM' | 'MORE';
  menuGroup: 'MODULES' | 'EMPLOYEE_SHIFT' | null;
}

const POSITION: Record<GqlMenuItem['position'], MenuItem['position']> = {
  BOTTOM: 'bottom',
  MORE: 'more',
};

const GROUP: Record<'MODULES' | 'EMPLOYEE_SHIFT', MenuGroup> = {
  MODULES: 'modules',
  EMPLOYEE_SHIFT: 'employee_shift',
};

/**
 * Schema enums are SCREAMING_SNAKE by convention; the app's domain type uses
 * lowercase unions. Mapping here means neither the schema nor any screen has to
 * compromise, and the mapping is identical for mock and live.
 */
const toMenuItem = (item: GqlMenuItem): MenuItem => ({
  id: item.id,
  menu_name: item.menuName,
  screen_name: item.screenName,
  menu_icon: item.menuIcon,
  position: POSITION[item.position],
  menu_group: item.menuGroup ? GROUP[item.menuGroup] : undefined,
});

export function useGetMenuItemsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{menuItems: GqlMenuItem[]}>(
    GET_MENU_ITEMS,
    {context: {feature: 'navigation'}, variables: {programId}},
  );

  // Memoised so the returned array keeps a stable identity between renders.
  // RTK Query's `data` was stable; consumers use it in dependency arrays and
  // would otherwise recompute on every render.
  const items = useMemo(
    () => (data?.menuItems ?? []).map(toMenuItem),
    [data],
  );

  return {data: items, isLoading: loading, isError: !!error, refetch};
}
