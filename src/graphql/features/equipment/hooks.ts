import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  CheckInEquipmentValues,
  CheckOutEquipmentValues,
  Equipment,
  EquipmentDetail,
  EquipmentFormOptions,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentUnit,
  EquipmentUpkeep,
  EquipmentUpkeepValues,
} from '../../../types/equipment';
// GET_EQUIPMENT_BY_CODE is deliberately not imported here — the document
// exists for slice 4's scanner, and importing it now would trip lint's
// unused-import rule.
import {
  ADD_EQUIPMENT_UPKEEP,
  CHECK_IN_EQUIPMENT,
  CHECK_OUT_EQUIPMENT,
  GET_EQUIPMENT,
  GET_EQUIPMENT_DETAIL,
  GET_EQUIPMENT_FORM_OPTIONS,
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

/** The mock store mutates in place, so refetch rather than patch the cache. */
const REFETCH = ['GetEquipment', 'GetMyEquipment', 'GetEquipmentDetail'];

export function useEquipmentFormOptionsQuery() {
  const {data, loading, error, refetch} = useQuery<{
    equipmentFormOptions: EquipmentFormOptions;
  }>(GET_EQUIPMENT_FORM_OPTIONS, EQUIPMENT_CONTEXT);
  return {
    data: data?.equipmentFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

export function useCheckOutEquipmentMutation() {
  const [run, {loading}] = useMutation<{
    checkOutEquipment: {id: string; reference: string};
  }>(CHECK_OUT_EQUIPMENT, {...EQUIPMENT_CONTEXT, refetchQueries: REFETCH});
  return {
    mutate: async (id: string, values: CheckOutEquipmentValues) => {
      const result = await run({
        variables: {
          input: {
            id,
            occurredAt: values.occurredAt,
            hasAbnormality: values.hasAbnormality,
            abnormality: values.hasAbnormality ? values.abnormality : null,
            description: values.description,
            images: values.images,
          },
        },
      });
      const newId = result.data?.checkOutEquipment.id ?? '';
      return {
        id: newId,
        reference: result.data?.checkOutEquipment.reference ?? '',
        // offlineQueueLink stamps queued ids with this prefix (link.ts) —
        // same convention useCreateFixtureMutation already uses.
        queued: newId.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useCheckInEquipmentMutation() {
  const [run, {loading}] = useMutation<{
    checkInEquipment: {id: string; reference: string};
  }>(CHECK_IN_EQUIPMENT, {...EQUIPMENT_CONTEXT, refetchQueries: REFETCH});
  return {
    mutate: async (id: string, values: CheckInEquipmentValues) => {
      const result = await run({
        variables: {
          input: {
            id,
            occurredAt: values.occurredAt,
            currentUsage: values.currentUsage,
            hasAbnormality: values.hasAbnormality,
            abnormality: values.hasAbnormality ? values.abnormality : null,
            description: values.description,
            images: values.images,
          },
        },
      });
      const newId = result.data?.checkInEquipment.id ?? '';
      return {
        id: newId,
        reference: result.data?.checkInEquipment.reference ?? '',
        queued: newId.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useAddEquipmentUpkeepMutation() {
  const [run, {loading}] = useMutation<{
    addEquipmentUpkeep: {id: string; reference: string};
  }>(ADD_EQUIPMENT_UPKEEP, {...EQUIPMENT_CONTEXT, refetchQueries: REFETCH});
  return {
    mutate: async (id: string, values: EquipmentUpkeepValues) => {
      const result = await run({
        variables: {
          input: {
            id,
            upkeepType: values.upkeepType,
            occurredAt: values.occurredAt,
            vendor: values.vendor,
            currentUsage: values.currentUsage,
            cost: values.cost,
            zone: values.zone,
            description: values.description,
            images: values.images,
          },
        },
      });
      const newId = result.data?.addEquipmentUpkeep.id ?? '';
      return {
        id: newId,
        reference: result.data?.addEquipmentUpkeep.reference ?? '',
        queued: newId.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}
