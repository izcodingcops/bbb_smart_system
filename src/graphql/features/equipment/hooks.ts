import {useCallback, useMemo} from 'react';
import {useLazyQuery, useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  CheckInEquipmentValues,
  CheckOutEquipmentValues,
  Equipment,
  EquipmentCategoryOption,
  EquipmentDetail,
  EquipmentFormOptions,
  EquipmentFormValues,
  EquipmentOwnership,
  EquipmentStatus,
  EquipmentUnit,
  EquipmentUpkeep,
  EquipmentUpkeepValues,
} from '../../../types/equipment';
import {
  ADD_EQUIPMENT_UPKEEP,
  CHECK_IN_EQUIPMENT,
  CHECK_OUT_EQUIPMENT,
  CREATE_EQUIPMENT,
  DELETE_EQUIPMENT,
  GET_EQUIPMENT,
  GET_EQUIPMENT_BY_CODE,
  GET_EQUIPMENT_DETAIL,
  GET_EQUIPMENT_FORM_OPTIONS,
  GET_MY_EQUIPMENT,
  UPDATE_EQUIPMENT,
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

// The outbound direction, for EquipmentInput. Both dropdowns hold the display
// value, so every submit passes through here.
const OWNERSHIP_OUT: Record<EquipmentOwnership, WireOwnership> = {
  Owned: 'OWNED',
  Leased: 'LEASED',
  Rented: 'RENTED',
  Loaned: 'LOANED',
};
const UNIT_OUT: Record<EquipmentUnit, WireUnit> = {
  Miles: 'MILES',
  Hours: 'HOURS',
  Kilometers: 'KILOMETERS',
  None: 'NONE',
};

/**
 * A blank optional text field is absent, not an empty string. Same helper,
 * same trimming, as poi/hooks.ts.
 */
const orNull = (value: string): string | null => value.trim() || null;

/**
 * Form values → EquipmentInput, shared by create and update so the two can't
 * drift.
 *
 * Ownership and Unit are required by the form, so its submit gate blocks a
 * blank one before this runs. Throwing rather than substituting a default
 * keeps a regression visible as a failed submit instead of a record quietly
 * saved as 'Owned' / 'None'.
 */
const toWireInput = (values: EquipmentFormValues) => {
  if (!values.ownership || !values.unit) {
    throw new Error('Ownership Status and Unit are required.');
  }
  return {
    serial: values.serial,
    name: values.name,
    acquiredAt: values.acquiredAt,
    category: values.category,
    equipmentType: values.equipmentType,
    make: values.make,
    model: values.model,
    unit: UNIT_OUT[values.unit],
    ownership: OWNERSHIP_OUT[values.ownership],
    fuel: values.fuel,
    year: orNull(values.year),
    beginningUsage: orNull(values.beginningUsage),
    zone: values.zone,
    description: orNull(values.description),
    images: values.images,
    incidents: values.incidents,
    personsOfInterest: values.personsOfInterest,
    maintenance: values.maintenance,
  };
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

/**
 * Look a record up by its serial or reference. Lazy, not a `useQuery`: the
 * code arrives from a QR scan or a typed entry, never from render.
 *
 * Apollo Client 4 keeps `variables` and `context` on the execute call rather
 * than on the hook options — `useLazyQuery.Options` declares neither, and
 * anything passed there is silently dropped. Hence `EQUIPMENT_CONTEXT` is
 * spread into `run()`, not into the hook.
 *
 * A miss resolves to `null` rather than throwing: "no equipment with that
 * number" is an ordinary outcome the caller renders as inline copy. A
 * transport failure still rejects, so a caller that can go offline should
 * await this inside a try/catch.
 */
export function useEquipmentByCodeLazy() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useLazyQuery<{
    equipmentByCode: GqlEquipment | null;
  }>(GET_EQUIPMENT_BY_CODE, {
    // A scan has to reflect the record's *current* custody state. Served from
    // cache, a record someone checked out two minutes ago still reads 'Active'
    // and routes the scanner into a Check-Out form that will fail.
    fetchPolicy: 'network-only',
  });

  // The sibling query hooks express this as `skip: !programId`; useLazyQuery
  // has no `skip`, so the same guard sits at the top of `lookup` — with no
  // active program there is nothing to search, and it reads as a miss.
  const lookup = useCallback(
    async (code: string): Promise<Equipment | null> => {
      if (!programId) {
        return null;
      }
      const result = await run({
        ...EQUIPMENT_CONTEXT,
        variables: {programId, code},
      });
      const record = result.data?.equipmentByCode;
      return record ? toEquipmentFromWire(record) : null;
    },
    [programId, run],
  );

  return {lookup, isLoading: loading};
}

/** The mock store mutates in place, so refetch rather than patch the cache. */
const REFETCH = ['GetEquipment', 'GetMyEquipment', 'GetEquipmentDetail'];

// Each custody mutation gets its own context (rather than reusing
// EQUIPMENT_CONTEXT) so it carries the offlineQueueKey offlineQueueLink
// needs to intercept it while offline — see fixture/hooks.ts's CREATE_CONTEXT
// for the same pattern. Queries stay on the plain EQUIPMENT_CONTEXT.
const CHECK_OUT_CONTEXT = {
  context: {feature: 'equipment', offlineQueueKey: 'CHECK_OUT_EQUIPMENT'},
};
const CHECK_IN_CONTEXT = {
  context: {feature: 'equipment', offlineQueueKey: 'CHECK_IN_EQUIPMENT'},
};
const ADD_UPKEEP_CONTEXT = {
  context: {feature: 'equipment', offlineQueueKey: 'ADD_EQUIPMENT_UPKEEP'},
};

const CREATE_CONTEXT = {
  context: {feature: 'equipment', offlineQueueKey: 'CREATE_EQUIPMENT'},
};

/**
 * The options payload as it arrives. `ownerships` and `units` are the wire
 * enums here — mapping them back to the display union below is what keeps the
 * form's dropdowns from showing 'OWNED', and what keeps the value they hand
 * back valid on the way out through `toWireInput`.
 */
interface GqlEquipmentFormOptions {
  upkeepTypes: string[];
  abnormalities: string[];
  zones: string[];
  regions: string[];
  divisions: string[];
  nextReference: string;
  categories: EquipmentCategoryOption[];
  ownerships: WireOwnership[];
  units: WireUnit[];
  fuels: string[];
  incidents: string[];
  personsOfInterest: string[];
  maintenance: string[];
}

export function useEquipmentFormOptionsQuery(
  fetchPolicy: 'network-only' | 'cache-first' = 'network-only',
) {
  const {data, loading, error, refetch} = useQuery<{
    equipmentFormOptions: GqlEquipmentFormOptions;
  }>(GET_EQUIPMENT_FORM_OPTIONS, {
    ...EQUIPMENT_CONTEXT,
    // `nextReference` has to be fresh on every open — the default. The list
    // filter sheet passes 'cache-first': it only reads Region/Division, which
    // don't need per-open freshness. See POI's own `usePoiFormOptionsQuery`
    // for the same convention.
    fetchPolicy,
  });

  // Memoised: the payload now carries a nested taxonomy tree, and a fresh
  // object each render would churn the form's derived option lists — which
  // the accordions key off, so they'd re-open on every keystroke.
  const options = useMemo<EquipmentFormOptions | null>(() => {
    const o = data?.equipmentFormOptions;
    if (!o) {
      return null;
    }
    return {
      upkeepTypes: o.upkeepTypes,
      abnormalities: o.abnormalities,
      zones: o.zones,
      regions: o.regions,
      divisions: o.divisions,
      nextReference: o.nextReference,
      categories: o.categories,
      ownerships: o.ownerships.map(v => OWNERSHIP[v]),
      units: o.units.map(v => UNIT[v]),
      fuels: o.fuels,
      incidents: o.incidents,
      personsOfInterest: o.personsOfInterest,
      maintenance: o.maintenance,
    };
  }, [data]);

  return {data: options, isLoading: loading, isError: !!error, refetch};
}

export function useCreateEquipmentMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createEquipment: {id: string; reference: string};
  }>(CREATE_EQUIPMENT, {
    ...CREATE_CONTEXT,
    refetchQueries: ['GetEquipment', 'GetMyEquipment'],
  });
  return {
    mutate: async (values: EquipmentFormValues) => {
      const result = await run({
        variables: {programId: programId ?? '', input: toWireInput(values)},
      });
      const id = result.data?.createEquipment.id ?? '';
      return {
        id,
        reference: result.data?.createEquipment.reference ?? '',
        // The name as submitted. Maintenance's Connected Elements lists
        // equipment by name, so a caller that opened this form to fill that
        // field can select the result without re-reading the store.
        name: values.name,
        // offlineQueueLink stamps queued ids with this prefix (link.ts) —
        // the same convention the three custody hooks already use.
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

// Update and delete carry no offlineQueueKey, so they simply reject when
// offline — matching useUpdatePoiMutation / useDeletePoiMutation. Queuing an
// edit against a record that may itself still be queued is a sequencing
// problem this module isn't solving.
export function useUpdateEquipmentMutation() {
  const [run, {loading}] = useMutation(UPDATE_EQUIPMENT, {
    ...EQUIPMENT_CONTEXT,
    refetchQueries: REFETCH,
  });
  return {
    mutate: async (id: string, values: EquipmentFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

// Delete fires from the detail screen as it unmounts, so 'GetEquipmentDetail'
// is left out — naming it would only earn Apollo's inactive-query warning.
export function useDeleteEquipmentMutation() {
  const [run, {loading}] = useMutation(DELETE_EQUIPMENT, {
    ...EQUIPMENT_CONTEXT,
    refetchQueries: ['GetEquipment', 'GetMyEquipment'],
  });
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}

export function useCheckOutEquipmentMutation() {
  const [run, {loading}] = useMutation<{
    checkOutEquipment: {id: string; reference: string};
  }>(CHECK_OUT_EQUIPMENT, {...CHECK_OUT_CONTEXT, refetchQueries: REFETCH});
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
  }>(CHECK_IN_EQUIPMENT, {...CHECK_IN_CONTEXT, refetchQueries: REFETCH});
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
  }>(ADD_EQUIPMENT_UPKEEP, {...ADD_UPKEEP_CONTEXT, refetchQueries: REFETCH});
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
