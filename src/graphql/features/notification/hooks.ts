import {useCallback, useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  AppNotification,
  NotificationIcon,
  NotificationModule,
  NotificationRecordType,
  NotificationTarget,
} from '../../../types/notification';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from './documents';

type WireModule =
  | 'MAINTENANCE'
  | 'INCIDENT'
  | 'FIXTURE'
  | 'EQUIPMENT'
  | 'CLEANING'
  | 'POI'
  | 'SYSTEM';

type WireRecordType =
  | 'MAINTENANCE'
  | 'INCIDENT'
  | 'FIXTURE'
  | 'POI'
  | 'WORK_LOG';

type WireIcon = 'SYNC' | 'COMMENT' | 'CLOCK' | 'BELL';

interface GqlNotificationTarget {
  recordType: WireRecordType;
  recordId: string;
  reference: string;
  title: string;
}

interface GqlNotification {
  id: string;
  module: WireModule;
  title: string;
  message: string;
  icon: WireIcon | null;
  createdAt: string;
  unread: boolean;
  related: GqlNotificationTarget | null;
}

const MODULE: Record<WireModule, NotificationModule> = {
  MAINTENANCE: 'Maintenance',
  INCIDENT: 'Incident',
  FIXTURE: 'Fixture',
  EQUIPMENT: 'Equipment',
  CLEANING: 'Cleaning',
  POI: 'POI',
  SYSTEM: 'System',
};

const ICON: Record<WireIcon, NotificationIcon> = {
  SYNC: 'Sync',
  COMMENT: 'Comment',
  CLOCK: 'Clock',
  BELL: 'Bell',
};

const RECORD_TYPE: Record<WireRecordType, NotificationRecordType> = {
  MAINTENANCE: 'Maintenance',
  INCIDENT: 'Incident',
  FIXTURE: 'Fixture',
  POI: 'Poi',
  WORK_LOG: 'WorkLog',
};

/** Nested enum, so it is lowered here rather than inline — see toWire. */
const toTarget = (t: GqlNotificationTarget): NotificationTarget => ({
  recordType: RECORD_TYPE[t.recordType],
  recordId: t.recordId,
  reference: t.reference,
  title: t.title,
});

const toNotification = (n: GqlNotification): AppNotification => ({
  id: n.id,
  module: MODULE[n.module],
  title: n.title,
  message: n.message,
  // Both nullable in the SDL: the mock always populates `related` on a linking
  // record, a real gateway will not.
  icon: n.icon ? ICON[n.icon] : null,
  createdAt: n.createdAt,
  unread: n.unread,
  related: n.related ? toTarget(n.related) : null,
});

const NOTIFICATION_CONTEXT = {context: {feature: 'notification'}};

export function useGetNotificationsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    notifications: GqlNotification[];
  }>(GET_NOTIFICATIONS, {
    ...NOTIFICATION_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
  });

  // Memoised so the returned array keeps a stable identity between renders —
  // NotificationsScreen feeds this into a useMemo dependency array, and a fresh
  // array each render would defeat the rows' React.memo.
  const notifications = useMemo(
    () => (data?.notifications ?? []).map(toNotification),
    [data],
  );

  return {data: notifications, isLoading: loading, isError: !!error, refetch};
}

export function useUnreadNotificationCountQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    unreadNotificationCount: number;
  }>(GET_UNREAD_NOTIFICATION_COUNT, {
    ...NOTIFICATION_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // A root scalar, so nothing normalises it back into place when a
    // notification is marked read. Re-reading on every mount is what keeps the
    // Home badge honest after a trip through the list.
    fetchPolicy: 'cache-and-network',
  });

  return {
    data: data?.unreadNotificationCount ?? 0,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

/**
 * Neither read mutation names a `refetchQueries`, unlike the other modules
 * here. Both select `id` and `unread` on a type the cache keys by `id`, so
 * normalisation writes the new flag straight into the rows the list is already
 * watching — and marking one read is usually the last thing that happens before
 * the deep link switches tabs and unmounts every query a refetch would name,
 * which is precisely when Apollo warns about refetching an inactive query. The
 * one value normalisation cannot reach, `unreadNotificationCount`, is a root
 * scalar and re-reads on mount instead.
 */
export function useMarkNotificationReadMutation() {
  const [run, {loading}] = useMutation(
    MARK_NOTIFICATION_READ,
    NOTIFICATION_CONTEXT,
  );
  // Memoised because the screen puts this in a useCallback dependency array —
  // a fresh arrow each render would defeat the rows' React.memo.
  const mutate = useCallback(
    async (id: string) => {
      await run({variables: {id}});
    },
    [run],
  );
  return {mutate, isLoading: loading};
}

export function useMarkAllNotificationsReadMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation(
    MARK_ALL_NOTIFICATIONS_READ,
    NOTIFICATION_CONTEXT,
  );
  const mutate = useCallback(async () => {
    await run({variables: {programId: programId ?? ''}});
  }, [run, programId]);
  return {mutate, isLoading: loading};
}
