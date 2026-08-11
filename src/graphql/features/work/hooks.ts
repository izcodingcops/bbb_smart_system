import {useCallback, useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  QuickAction,
  WorkBucket,
  WorkCategory,
  WorkItem,
  WorkPriority,
  WorkStatus,
} from '../../../types/work';
import {GET_QUICK_ACTIONS, GET_WORK_ITEMS, SET_WORK_ITEM_STATUS} from './documents';

interface GqlWorkItem {
  id: string;
  ticketNumber: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  occurredAt: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  zone: string;
  assignee: string;
  assigneeInitials: string;
  address: string;
  bucket: 'ASSIGNED' | 'UNASSIGNED' | 'COMPLETED';
  outcome: string | null;
  interaction: string | null;
  disposition: string | null;
  businessName: string | null;
  quantity: string | null;
  createdBy: string | null;
}

const STATUS: Record<GqlWorkItem['status'], WorkStatus> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY: Record<GqlWorkItem['priority'], WorkPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
const BUCKET: Record<GqlWorkItem['bucket'], WorkBucket> = {
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
  COMPLETED: 'completed',
};
const STATUS_OUT: Record<WorkStatus, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};

const toWorkItem = (item: GqlWorkItem): WorkItem => ({
  id: item.id,
  reference: item.ticketNumber,
  category: item.category as WorkCategory,
  status: STATUS[item.status],
  date: item.occurredAt,
  type: item.type,
  priority: PRIORITY[item.priority],
  zone: item.zone,
  assignee: item.assignee,
  assigneeInitials: item.assigneeInitials,
  address: item.address,
  bucket: BUCKET[item.bucket],
  outcome: item.outcome ?? undefined,
  interaction: item.interaction ?? undefined,
  disposition: item.disposition ?? undefined,
  businessName: item.businessName ?? undefined,
  quantity: item.quantity ?? undefined,
  createdBy: item.createdBy ?? undefined,
});

const WORK_CONTEXT = {context: {feature: 'work'}};

export function useGetWorkItemsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{workItems: GqlWorkItem[]}>(
    GET_WORK_ITEMS,
    {
      ...WORK_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  // Memoised so the returned array keeps a stable identity between renders.
  // RTK Query's `data` was stable; consumers use it in dependency arrays.
  const items = useMemo(() => (data?.workItems ?? []).map(toWorkItem), [data]);

  return {data: items, isLoading: loading, isError: !!error, refetch};
}

export function useGetQuickActionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{quickActions: QuickAction[]}>(
    GET_QUICK_ACTIONS,
    {
      ...WORK_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  // `?? []` would allocate a fresh array on every render while data is
  // undefined, so memoise here too.
  const actions = useMemo(() => data?.quickActions ?? [], [data]);

  return {data: actions, isLoading: loading, isError: !!error, refetch};
}

// The mock store mutates in place, so refetch rather than patch the cache.
export function useSetWorkItemStatusMutation() {
  const [run, {loading}] = useMutation(SET_WORK_ITEM_STATUS, {
    ...WORK_CONTEXT,
    refetchQueries: ['GetWorkItems'],
  });
  // Memoised because the list screens put this in a useCallback dependency
  // array — a fresh arrow each render would defeat the cards' React.memo.
  const mutate = useCallback(
    async (id: string, status: WorkStatus) => {
      await run({variables: {id, status: STATUS_OUT[status]}});
    },
    [run],
  );
  return {mutate, isLoading: loading};
}
