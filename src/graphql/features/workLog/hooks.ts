import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId, GetShiftTypes} from '../../../redux/auth/selectors';
import {GetActiveShiftTypeId} from '../../../redux/shift/selectors';
import {
  WorkLogEntry,
  WorkLogFormOptions,
  WorkLogFormValues,
  YesNo,
} from '../../../types/workLog';
import {
  CREATE_WORK_LOG_ENTRY,
  DELETE_WORK_LOG_ENTRY,
  GET_WORK_LOG_ENTRIES,
  GET_WORK_LOG_ENTRY,
  GET_WORK_LOG_FORM_OPTIONS,
  UPDATE_WORK_LOG_ENTRY,
} from './documents';

interface GqlWorkLogEntry {
  id: string;
  reference: string;
  shiftTypeId: string;
  shiftTypeName: string;
  entryType: string;
  machineNo: string;
  requestDateTime: string;
  fvmAccessibilityChecked: 'YES' | 'NO';
  bridgePlateSecured: 'YES' | 'NO';
  accessibleFareGateWorking: 'YES' | 'NO';
  automaticDoorWorking: 'YES' | 'NO';
  fvmNotWorking: 'YES' | 'NO';
  address: string;
  zone: string | null;
  describeLocation: string;
  businessName: string | null;
  quantity: string;
  loggedBy: string;
  createdAt: string;
}

const YES_NO: Record<'YES' | 'NO', YesNo> = {YES: 'yes', NO: 'no'};
const YES_NO_OUT: Record<YesNo, string> = {yes: 'YES', no: 'NO'};

const toWorkLogEntry = (e: GqlWorkLogEntry): WorkLogEntry => ({
  id: e.id,
  reference: e.reference,
  shiftTypeId: e.shiftTypeId,
  shiftTypeName: e.shiftTypeName,
  entryType: e.entryType,
  machineNo: e.machineNo,
  requestDateTime: e.requestDateTime,
  fvmAccessibilityChecked: YES_NO[e.fvmAccessibilityChecked],
  bridgePlateSecured: YES_NO[e.bridgePlateSecured],
  accessibleFareGateWorking: YES_NO[e.accessibleFareGateWorking],
  automaticDoorWorking: YES_NO[e.automaticDoorWorking],
  fvmNotWorking: YES_NO[e.fvmNotWorking],
  address: e.address,
  zone: e.zone,
  describeLocation: e.describeLocation,
  businessName: e.businessName,
  quantity: e.quantity,
  loggedBy: e.loggedBy,
  createdAt: e.createdAt,
});

const WORKLOG_CONTEXT = {context: {feature: 'workLog'}};

/**
 * `filter` is wired into the document but sent as null: the screen filters,
 * sorts and searches client-side, same convention as Fixture and Maintenance.
 */
export function useGetWorkLogEntriesQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    workLogEntries: GqlWorkLogEntry[];
  }>(GET_WORK_LOG_ENTRIES, {
    ...WORKLOG_CONTEXT,
    variables: {programId: programId ?? '', filter: null},
    skip: !programId,
  });

  const entries = useMemo(
    () => (data?.workLogEntries ?? []).map(toWorkLogEntry),
    [data],
  );

  return {data: entries, isLoading: loading, isError: !!error, refetch};
}

export function useGetWorkLogEntryQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    workLogEntry: GqlWorkLogEntry | null;
  }>(GET_WORK_LOG_ENTRY, {...WORKLOG_CONTEXT, variables: {id}});

  const entry = useMemo(
    () => (data?.workLogEntry ? toWorkLogEntry(data.workLogEntry) : null),
    [data],
  );

  return {data: entry, isLoading: loading, isError: !!error, refetch};
}

export function useWorkLogFormOptionsQuery(shiftTypeId: string) {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    workLogFormOptions: WorkLogFormOptions;
  }>(GET_WORK_LOG_FORM_OPTIONS, {
    ...WORKLOG_CONTEXT,
    variables: {programId: programId ?? '', shiftTypeId},
    skip: !programId,
    // nextReference has to be fresh on every open.
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.workLogFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

const toWireInput = (values: WorkLogFormValues) => ({
  entryType: values.entryType,
  machineNo: values.machineNo,
  requestDateTime: values.requestDateTime,
  fvmAccessibilityChecked: YES_NO_OUT[values.fvmAccessibilityChecked ?? 'no'],
  bridgePlateSecured: YES_NO_OUT[values.bridgePlateSecured ?? 'no'],
  accessibleFareGateWorking: YES_NO_OUT[values.accessibleFareGateWorking ?? 'no'],
  automaticDoorWorking: YES_NO_OUT[values.automaticDoorWorking ?? 'no'],
  fvmNotWorking: YES_NO_OUT[values.fvmNotWorking ?? 'no'],
  address: values.address,
  zone: values.zone,
  describeLocation: values.describeLocation || null,
  businessName: values.businessName,
  quantity: values.quantity || '01',
});

/**
 * The mock store mutates in place, so refetch rather than patch the cache.
 * 'GetWorkItems' is included because the Work tab's list computes its Activity
 * items live from this same store (see work/resolvers.ts) — without refetching
 * it too, a created/updated/deleted entry wouldn't show up there until some
 * unrelated refetch happened to run.
 */
const REFRESH_LIST = {
  ...WORKLOG_CONTEXT,
  refetchQueries: ['GetWorkLogEntries', 'GetWorkItems'],
};
const REFRESH_DETAIL = {
  ...WORKLOG_CONTEXT,
  refetchQueries: ['GetWorkLogEntries', 'GetWorkLogEntry', 'GetWorkItems'],
};

const CREATE_CONTEXT = {
  context: {feature: 'workLog', offlineQueueKey: 'CREATE_WORK_LOG_ENTRY'},
  refetchQueries: ['GetWorkLogEntries', 'GetWorkItems'],
};

/**
 * Resolves the frozen `shiftTypeId`/`shiftTypeName` pair itself from the
 * active shift, so callers only ever pass form values — the shift a Work Log
 * entry is logged under is never a form field.
 */
export function useCreateWorkLogEntryMutation() {
  const programId = GetActiveProgramId();
  const shiftTypes = GetShiftTypes();
  const shiftTypeId = GetActiveShiftTypeId();
  const shiftTypeName =
    shiftTypes.find(t => t.id === shiftTypeId)?.name ?? 'Shift';
  const [run, {loading}] = useMutation<{
    createWorkLogEntry: {id: string; reference: string};
  }>(CREATE_WORK_LOG_ENTRY, CREATE_CONTEXT);
  return {
    mutate: async (values: WorkLogFormValues) => {
      const result = await run({
        variables: {
          programId: programId ?? '',
          input: {...toWireInput(values), shiftTypeId, shiftTypeName},
        },
      });
      const id = result.data?.createWorkLogEntry.id ?? '';
      return {
        id,
        reference: result.data?.createWorkLogEntry.reference ?? '',
        // `offlineQueueLink` stamps queued ids with this prefix (link.ts) —
        // cheaper than threading a separate flag through Apollo's context.
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useUpdateWorkLogEntryMutation() {
  const [run, {loading}] = useMutation(UPDATE_WORK_LOG_ENTRY, REFRESH_DETAIL);
  return {
    mutate: async (id: string, values: WorkLogFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

export function useDeleteWorkLogEntryMutation() {
  const [run, {loading}] = useMutation(DELETE_WORK_LOG_ENTRY, REFRESH_LIST);
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}
