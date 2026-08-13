import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Equipment,
  EquipmentDetail,
  EquipmentItem,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentUnit,
  EquipmentUpkeep,
} from '../../../types/equipment';
import {formatTimeOfDay} from '../../../utils/time';
// GET_EQUIPMENT_BY_CODE is deliberately not imported here — the document
// exists for slice 4's scanner, and importing it now would trip lint's
// unused-import rule.
import {
  GET_CHECKED_IN_EQUIPMENT,
  GET_EQUIPMENT,
  GET_EQUIPMENT_DETAIL,
  GET_MY_EQUIPMENT,
} from './documents';

export const EQUIPMENT_CONTEXT = {context: {feature: 'equipment'}};

type WireStatus = 'ACTIVE' | 'CHECKED_OUT';
type WireOwnership = 'OWNED' | 'LEASED' | 'RENTED' | 'LOANED';
type WireUnit = 'MILES' | 'HOURS' | 'KILOMETERS' | 'NONE';

const STATUS: Record<WireStatus, EquipmentStatus> = {
  ACTIVE: 'Active',
  CHECKED_OUT: 'Checked-Out',
};
const OWNERSHIP: Record<WireOwnership, EquipmentOwnership> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
  RENTED: 'Rented',
  LOANED: 'Loaned',
};
const UNIT: Record<WireUnit, EquipmentUnit> = {
  MILES: 'Miles',
  HOURS: 'Hours',
  KILOMETERS: 'Kilometers',
  NONE: 'None',
};

export interface GqlEquipment {
  id: string;
  reference: string;
  serial: string;
  name: string;
  equipmentType: string;
  category: string;
  make: string;
  model: string;
  zone: string;
  program: string;
  region: string;
  division: string;
  status: WireStatus;
  createdAt: string;
  acquiredAt: string | null;
  unit: WireUnit;
  beginningUsage: string | null;
  year: string | null;
  ownership: WireOwnership;
  description: string | null;
  checkedOutBy: string | null;
  checkedOutAt: string | null;
  mine: boolean;
  queuedOffline: boolean;
}

export interface GqlEquipmentDetail extends GqlEquipment {
  fuel: string | null;
  images: string[] | null;
  upkeeps: EquipmentUpkeep[] | null;
  incidents: string[] | null;
  personsOfInterest: string[] | null;
  maintenance: string[] | null;
}

export const toEquipmentFromWire = (e: GqlEquipment): Equipment => ({
  id: e.id,
  reference: e.reference,
  serial: e.serial,
  name: e.name,
  equipmentType: e.equipmentType,
  category: e.category,
  make: e.make,
  model: e.model,
  zone: e.zone,
  program: e.program,
  region: e.region,
  division: e.division,
  status: STATUS[e.status],
  createdAt: e.createdAt,
  acquiredAt: e.acquiredAt,
  unit: UNIT[e.unit],
  beginningUsage: e.beginningUsage,
  year: e.year,
  ownership: OWNERSHIP[e.ownership],
  description: e.description,
  checkedOutBy: e.checkedOutBy,
  checkedOutAt: e.checkedOutAt,
  mine: e.mine,
  queuedOffline: e.queuedOffline,
});

/**
 * The list fields are non-null in the SDL and always populated by the mock,
 * but a real gateway will not be so reliable — coalesce here rather than at
 * every render site.
 */
const toEquipmentDetailFromWire = (e: GqlEquipmentDetail): EquipmentDetail => ({
  ...toEquipmentFromWire(e),
  fuel: e.fuel,
  images: e.images ?? [],
  upkeeps: e.upkeeps ?? [],
  incidents: e.incidents ?? [],
  personsOfInterest: e.personsOfInterest ?? [],
  maintenance: e.maintenance ?? [],
});

export function useGetEquipmentQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{equipment: GqlEquipment[]}>(
    GET_EQUIPMENT,
    {
      ...EQUIPMENT_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  // Memoised so the memoized cards downstream keep a stable array identity.
  const items = useMemo(
    () => (data?.equipment ?? []).map(toEquipmentFromWire),
    [data],
  );

  return {data: items, isLoading: loading, isError: !!error, refetch};
}

export function useGetMyEquipmentQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{myEquipment: GqlEquipment[]}>(
    GET_MY_EQUIPMENT,
    {
      ...EQUIPMENT_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  const items = useMemo(
    () => (data?.myEquipment ?? []).map(toEquipmentFromWire),
    [data],
  );

  return {data: items, isLoading: loading, isError: !!error, refetch};
}

export function useGetEquipmentDetailQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    equipmentDetail: GqlEquipmentDetail | null;
  }>(GET_EQUIPMENT_DETAIL, {
    ...EQUIPMENT_CONTEXT,
    variables: {id},
    skip: !id,
  });

  const detail = useMemo(
    () =>
      data?.equipmentDetail
        ? toEquipmentDetailFromWire(data.equipmentDetail)
        : null,
    [data],
  );

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}

/* --- Legacy: Home's checked-in card. Deleted in Task 6. ------------------ */

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

export function useGetCheckedInEquipmentQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    checkedInEquipment: GqlEquipmentItem[];
  }>(GET_CHECKED_IN_EQUIPMENT, {
    ...EQUIPMENT_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
  });

  const items = useMemo<EquipmentItem[]>(
    () =>
      (data?.checkedInEquipment ?? []).map(item => ({
        id: item.assetTag,
        name: item.name,
        category: item.category,
        checkedInAt: formatTimeOfDay(new Date(item.checkedInAt)),
        status: item.status === 'OVERDUE' ? 'Overdue' : 'Active',
        icon: item.icon,
        tint: item.tint,
        iconColor: item.iconColor,
      })),
    [data],
  );

  return {data: items, isLoading: loading, isError: !!error, refetch};
}
