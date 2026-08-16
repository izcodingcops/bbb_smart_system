import {useCallback, useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Poi,
  PoiContact,
  PoiCreator,
  PoiDetail,
  PoiDisposition,
  PoiFormOptions,
  PoiFormValues,
  PoiInteraction,
  PoiInteractionFormOptions,
  PoiInteractionFormValues,
  PoiUpdate,
  PoiUpdateFormOptions,
  PoiUpdateFormValues,
} from '../../../types/poi';
import {
  ADD_POI_INTERACTION,
  ADD_POI_UPDATE,
  CREATE_POI,
  DELETE_POI,
  GET_POI,
  GET_POIS,
  GET_POI_FORM_OPTIONS,
  GET_POI_INTERACTION_FORM_OPTIONS,
  GET_POI_UPDATE_FORM_OPTIONS,
  UPDATE_POI,
} from './documents';

type WireDisposition =
  | 'ACTIVE'
  | 'DECEASED'
  | 'HOUSED'
  | 'IN_ACTIVE'
  | 'INCARCERATED'
  | 'TRANSITIONAL_CARE';

interface GqlPoi {
  id: string;
  reference: string;
  name: string;
  personType: string;
  disposition: WireDisposition;
  zone: string;
  address: string;
  interactionCount: number;
  createdBy: PoiCreator;
  queuedOffline: boolean;
  lastModifiedAt: string;
}

const DISPOSITION: Record<WireDisposition, PoiDisposition> = {
  ACTIVE: 'Active',
  DECEASED: 'Deceased',
  HOUSED: 'Housed',
  IN_ACTIVE: 'In-active',
  INCARCERATED: 'Incarcerated',
  TRANSITIONAL_CARE: 'Transitional Care',
};

const DISPOSITION_OUT: Record<PoiDisposition, WireDisposition> = {
  Active: 'ACTIVE',
  Deceased: 'DECEASED',
  Housed: 'HOUSED',
  'In-active': 'IN_ACTIVE',
  Incarcerated: 'INCARCERATED',
  'Transitional Care': 'TRANSITIONAL_CARE',
};

const toPoi = (p: GqlPoi): Poi => ({
  id: p.id,
  reference: p.reference,
  name: p.name,
  personType: p.personType,
  disposition: DISPOSITION[p.disposition],
  zone: p.zone,
  address: p.address,
  interactionCount: p.interactionCount,
  createdBy: p.createdBy,
  queuedOffline: p.queuedOffline,
  lastModifiedAt: p.lastModifiedAt,
});

interface GqlPoiDetail extends GqlPoi {
  firstSeenAt: string;
  lastModifiedBy: string | null;
  contact: string | null;
  top1020: boolean | null;
  alias: string | null;
  gender: string | null;
  age: string | null;
  race: string | null;
  weight: string | null;
  height: string | null;
  physicalDescription: string | null;
  situation: string | null;
  describeLocation: string | null;
  contacts: PoiContact[] | null;
  connectedIncidents: string[] | null;
  connectedMaintenance: string[] | null;
  connectedEquipment: string[] | null;
  interactions: PoiInteraction[] | null;
  updates: PoiUpdate[] | null;
}

/**
 * Every array the SDL declares nullable is coalesced here. The mock always
 * populates them; a real gateway will not.
 */
const toDetail = (d: GqlPoiDetail): PoiDetail => ({
  ...toPoi(d),
  firstSeenAt: d.firstSeenAt,
  lastModifiedBy: d.lastModifiedBy,
  contact: d.contact,
  top1020: d.top1020 ?? false,
  alias: d.alias,
  gender: d.gender,
  age: d.age,
  race: d.race,
  weight: d.weight,
  height: d.height,
  physicalDescription: d.physicalDescription,
  situation: d.situation,
  describeLocation: d.describeLocation,
  contacts: d.contacts ?? [],
  connectedIncidents: d.connectedIncidents ?? [],
  connectedMaintenance: d.connectedMaintenance ?? [],
  connectedEquipment: d.connectedEquipment ?? [],
  interactions: d.interactions ?? [],
  updates: d.updates ?? [],
});

/** An empty optional field goes on the wire as null, not ''. */
const orNull = (value: string): string | null => value.trim() || null;

const toWireInput = (values: PoiFormValues) => ({
  name: values.name,
  personType: values.personType,
  disposition: DISPOSITION_OUT[values.disposition],
  occurredAt: values.occurredAt,
  contact: orNull(values.contact),
  top1020: values.top1020,
  alias: orNull(values.alias),
  gender: orNull(values.gender),
  age: orNull(values.age),
  race: orNull(values.race),
  weight: orNull(values.weight),
  height: orNull(values.height),
  physicalDescription: orNull(values.physicalDescription),
  situation: orNull(values.situation),
  // A contact card left entirely blank is dropped rather than saved empty.
  contacts: values.contacts.filter(
    c => c.name || c.email || c.phone || c.relationship || c.notes,
  ),
  connectedIncidents: values.connectedIncidents,
  connectedMaintenance: values.connectedMaintenance,
  connectedEquipment: values.connectedEquipment,
});

const toWireInteractionInput = (values: PoiInteractionFormValues) => ({
  interactionType: values.interactionType,
  occurredAt: values.occurredAt,
  zone: values.zone,
  fixture: orNull(values.fixture),
  businessLocation: orNull(values.businessLocation),
  violation: orNull(values.violation),
  note: orNull(values.note),
  documents: values.documents,
});

const toWireUpdateInput = (values: PoiUpdateFormValues) => ({
  occurredAt: values.occurredAt,
  zone: values.zone,
  description: values.description,
});

const POI_CONTEXT = {context: {feature: 'poi'}};

/** The mock store mutates in place, so refetch rather than patch the cache. */
const REFRESH_LIST = {...POI_CONTEXT, refetchQueries: ['GetPois']};
const REFRESH_DETAIL = {...POI_CONTEXT, refetchQueries: ['GetPois', 'GetPoi']};

const CREATE_CONTEXT = {
  context: {feature: 'poi', offlineQueueKey: 'CREATE_POI'},
  refetchQueries: ['GetPois'],
};
/**
 * Both sub-record creates are reached by routing away from the detail screen,
 * so 'GetPoi' is guaranteed to be unmounted by the time they run — naming it in
 * refetchQueries only earns Apollo's "unknown query" warning and refreshes
 * nothing. The detail's own cache-and-network policy is what reconciles the
 * timeline on the way back in.
 */
const ADD_INTERACTION_CONTEXT = {
  context: {feature: 'poi', offlineQueueKey: 'ADD_POI_INTERACTION'},
  refetchQueries: ['GetPois'],
};
const ADD_UPDATE_CONTEXT = {
  context: {feature: 'poi', offlineQueueKey: 'ADD_POI_UPDATE'},
  refetchQueries: ['GetPois'],
};

/**
 * `filter` is wired into the document but sent as null: the screen filters,
 * sorts and searches client-side via src/screens/poi/filtering.ts, same
 * convention as Fixture and Maintenance.
 */
export function useGetPoisQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{pois: GqlPoi[]}>(GET_POIS, {
    ...POI_CONTEXT,
    variables: {programId: programId ?? '', filter: null},
    skip: !programId,
  });

  // Memoised so the returned array keeps a stable identity between renders —
  // PoiScreen feeds this into a useMemo dependency array, and PoiCard is
  // React.memo'd, so a fresh array each render would defeat both.
  const pois = useMemo(() => (data?.pois ?? []).map(toPoi), [data]);

  return {data: pois, isLoading: loading, isError: !!error, refetch};
}

export function useGetPoiQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    poi: GqlPoiDetail | null;
  }>(GET_POI, {
    ...POI_CONTEXT,
    variables: {id},
    // Interactions and updates are created from screens that unmount this one,
    // and the mock store mutates in place — so a cache-first read would show a
    // timeline that's one entry behind. Serve the cache instantly, then
    // reconcile.
    fetchPolicy: 'cache-and-network',
  });

  const detail = useMemo(() => (data?.poi ? toDetail(data.poi) : null), [data]);

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}

export function usePoiFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    poiFormOptions: PoiFormOptions;
  }>(GET_POI_FORM_OPTIONS, {
    ...POI_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // nextReference has to be fresh on every open.
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.poiFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

export function usePoiInteractionFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    poiInteractionFormOptions: PoiInteractionFormOptions;
  }>(GET_POI_INTERACTION_FORM_OPTIONS, {
    ...POI_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.poiInteractionFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

export function usePoiUpdateFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    poiUpdateFormOptions: PoiUpdateFormOptions;
  }>(GET_POI_UPDATE_FORM_OPTIONS, {
    ...POI_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.poiUpdateFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

/** What all three create flows report back, so the screens stay identical. */
export interface PoiCreateResult {
  id: string;
  reference: string;
  queued: boolean;
}

/**
 * The person create reports its name on top of that. Other modules list people
 * by name, so a caller that opened this form to fill such a field can select
 * the result without re-reading the store. Interactions and updates have no
 * equivalent, which is why this is a separate type rather than an optional
 * field on the shared one.
 */
export interface PersonCreateResult extends PoiCreateResult {
  name: string;
}

export function useCreatePoiMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createPoi: {id: string; reference: string};
  }>(CREATE_POI, CREATE_CONTEXT);
  return {
    mutate: async (values: PoiFormValues): Promise<PersonCreateResult> => {
      const result = await run({
        variables: {programId: programId ?? '', input: toWireInput(values)},
      });
      const id = result.data?.createPoi.id ?? '';
      return {
        id,
        reference: result.data?.createPoi.reference ?? '',
        name: values.name,
        // offlineQueueLink stamps queued ids with this prefix (link.ts) —
        // the same convention useCreateFixtureMutation already uses.
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useUpdatePoiMutation() {
  const [run, {loading}] = useMutation(UPDATE_POI, REFRESH_DETAIL);
  return {
    mutate: async (id: string, values: PoiFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

// Delete is fired from the detail screen as it unmounts, so 'GetPoi' is left
// out — naming it would make Apollo warn about refetching an inactive query.
export function useDeletePoiMutation() {
  const [run, {loading}] = useMutation(DELETE_POI, REFRESH_LIST);
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}

export function useAddPoiInteractionMutation() {
  const [run, {loading}] = useMutation<{
    addPoiInteraction: {id: string; reference: string};
  }>(ADD_POI_INTERACTION, ADD_INTERACTION_CONTEXT);
  // Memoised because the list screen puts this behind a card callback — a
  // fresh arrow each render would defeat PoiCard's React.memo.
  const mutate = useCallback(
    async (
      personId: string,
      values: PoiInteractionFormValues,
    ): Promise<PoiCreateResult> => {
      const result = await run({
        variables: {personId, input: toWireInteractionInput(values)},
      });
      const id = result.data?.addPoiInteraction.id ?? '';
      return {
        id,
        reference: result.data?.addPoiInteraction.reference ?? '',
        queued: id.startsWith('outbox_'),
      };
    },
    [run],
  );
  return {mutate, isLoading: loading};
}

export function useAddPoiUpdateMutation() {
  const [run, {loading}] = useMutation<{
    addPoiUpdate: {id: string; reference: string};
  }>(ADD_POI_UPDATE, ADD_UPDATE_CONTEXT);
  const mutate = useCallback(
    async (
      personId: string,
      values: PoiUpdateFormValues,
    ): Promise<PoiCreateResult> => {
      const result = await run({
        variables: {personId, input: toWireUpdateInput(values)},
      });
      const id = result.data?.addPoiUpdate.id ?? '';
      return {
        id,
        reference: result.data?.addPoiUpdate.reference ?? '',
        queued: id.startsWith('outbox_'),
      };
    },
    [run],
  );
  return {mutate, isLoading: loading};
}
