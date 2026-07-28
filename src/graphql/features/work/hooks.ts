import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {QuickAction, WorkBucket, WorkItem, WorkPriority, WorkStatus} from '../../../types/work';
import {GET_QUICK_ACTIONS, GET_WORK_ITEMS} from './documents';

interface GqlWorkItem {
  id: string;
  ticketNumber: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  occurredAt: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: string;
  assigneeInitials: string;
  address: string;
  bucket: 'ASSIGNED' | 'COMPLETED';
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
  COMPLETED: 'completed',
};

const toWorkItem = (item: GqlWorkItem): WorkItem => ({
  id: item.ticketNumber,
  category: item.category,
  status: STATUS[item.status],
  date: item.occurredAt,
  type: item.type,
  priority: PRIORITY[item.priority],
  assignee: item.assignee,
  assigneeInitials: item.assigneeInitials,
  address: item.address,
  bucket: BUCKET[item.bucket],
});

export function useGetWorkItemsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{workItems: GqlWorkItem[]}>(
    GET_WORK_ITEMS,
    {
      context: {feature: 'work'},
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
      context: {feature: 'work'},
      variables: {programId: programId ?? ''},
      skip: !programId,
    },
  );

  // `?? []` would allocate a fresh array on every render while data is
  // undefined, so memoise here too.
  const actions = useMemo(() => data?.quickActions ?? [], [data]);

  return {data: actions, isLoading: loading, isError: !!error, refetch};
}
