import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {CheckedInStatus, EquipmentItem} from '../../../types/equipment';
import {formatTimeOfDay} from '../../../utils/time';
import {GET_CHECKED_IN_EQUIPMENT} from './documents';

interface GqlEquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  checkedInAt: string;
  status: 'ACTIVE' | 'OVERDUE';
  icon: string;
  tint: string;
  iconColor: string;
}

const STATUS: Record<GqlEquipmentItem['status'], CheckedInStatus> = {
  ACTIVE: 'Active',
  OVERDUE: 'Overdue',
};

/** The schema returns ISO-8601; the card shows a clock time. */
const toEquipmentItem = (item: GqlEquipmentItem): EquipmentItem => ({
  id: item.assetTag,
  name: item.name,
  category: item.category,
  checkedInAt: formatTimeOfDay(new Date(item.checkedInAt)),
  status: STATUS[item.status],
  icon: item.icon,
  tint: item.tint,
  iconColor: item.iconColor,
});

export function useGetCheckedInEquipmentQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    checkedInEquipment: GqlEquipmentItem[];
  }>(GET_CHECKED_IN_EQUIPMENT, {
    context: {feature: 'equipment'},
    variables: {programId: programId ?? ''},
    skip: !programId,
  });

  // Memoised so the returned array keeps a stable identity between renders.
  const items = useMemo(
    () => (data?.checkedInEquipment ?? []).map(toEquipmentItem),
    [data],
  );

  return {data: items, isLoading: loading, isError: !!error, refetch};
}
