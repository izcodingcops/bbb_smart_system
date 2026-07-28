import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  MaintenanceAssignee,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../types/maintenance';
import {GET_MAINTENANCE_REQUESTS} from './documents';

interface GqlMaintenanceRequest {
  id: string;
  reference: string;
  type: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  requestedAt: string;
  businessName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: MaintenanceAssignee | null;
  address: string;
  routedToSupervisor: boolean;
  queuedOffline: boolean;
}

const STATUS: Record<GqlMaintenanceRequest['status'], MaintenanceStatus> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY: Record<GqlMaintenanceRequest['priority'], MaintenancePriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const toRequest = (r: GqlMaintenanceRequest): MaintenanceRequest => ({
  id: r.reference,
  type: r.type,
  status: STATUS[r.status],
  requestedAt: r.requestedAt,
  businessName: r.businessName,
  priority: PRIORITY[r.priority],
  assignee: r.assignee,
  address: r.address,
  routedToSupervisor: r.routedToSupervisor,
  queuedOffline: r.queuedOffline,
});

/**
 * `filter` is wired into the document but sent as null: the screen still
 * filters, sorts and searches client-side via src/screens/maintenance/filtering.ts.
 * When the gateway implements server-side filtering, pass the built filter here
 * and delete the client-side pass — no call site changes.
 */
export function useGetMaintenanceRequestsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    maintenanceRequests: GqlMaintenanceRequest[];
  }>(GET_MAINTENANCE_REQUESTS, {
    context: {feature: 'maintenance'},
    variables: {programId: programId ?? '', filter: null},
    skip: !programId,
  });

  // Memoised so the returned array keeps a stable identity between renders.
  // MaintenanceScreen feeds this into a useMemo dependency array, which would
  // otherwise recompute the filter/sort pipeline on every render.
  const requests = useMemo(
    () => (data?.maintenanceRequests ?? []).map(toRequest),
    [data],
  );

  return {data: requests, isLoading: loading, isError: !!error, refetch};
}
