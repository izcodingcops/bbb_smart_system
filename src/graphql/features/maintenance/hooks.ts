import {useCallback, useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  MaintenanceAssignee,
  MaintenanceAssigneeKind,
  MaintenanceComment,
  MaintenanceDetail,
  MaintenanceFormOptions,
  MaintenanceFormValues,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../types/maintenance';
import {
  ADD_MAINTENANCE_COMMENT,
  ASSIGN_MAINTENANCE_REQUEST,
  CREATE_MAINTENANCE_FIXTURE,
  CREATE_MAINTENANCE_REQUEST,
  DELETE_MAINTENANCE_COMMENT,
  DELETE_MAINTENANCE_REQUEST,
  GET_MAINTENANCE_FORM_OPTIONS,
  GET_MAINTENANCE_REQUEST,
  GET_MAINTENANCE_REQUESTS,
  SET_MAINTENANCE_STATUS,
  UPDATE_MAINTENANCE_COMMENT,
  UPDATE_MAINTENANCE_REQUEST,
} from './documents';

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
  completedBy: string | null;
  assigneeKind: 'SUPERVISOR' | 'DEPARTMENT';
  department: string | null;
  createdBy: string;
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
const ASSIGNEE_KIND: Record<
  'SUPERVISOR' | 'DEPARTMENT',
  MaintenanceAssigneeKind
> = {
  SUPERVISOR: 'Supervisor',
  DEPARTMENT: 'Department',
};

const toRequest = (r: GqlMaintenanceRequest): MaintenanceRequest => ({
  id: r.id,
  reference: r.reference,
  type: r.type,
  status: STATUS[r.status],
  requestedAt: r.requestedAt,
  businessName: r.businessName,
  priority: PRIORITY[r.priority],
  assignee: r.assignee,
  address: r.address,
  routedToSupervisor: r.routedToSupervisor,
  queuedOffline: r.queuedOffline,
  completedBy: r.completedBy,
  assigneeKind: ASSIGNEE_KIND[r.assigneeKind],
  department: r.department,
  createdBy: r.createdBy,
});

const MAINTENANCE_CONTEXT = {context: {feature: 'maintenance'}};

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
    ...MAINTENANCE_CONTEXT,
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

const STATUS_OUT: Record<MaintenanceStatus, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY_OUT: Record<MaintenancePriority, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

interface GqlMaintenanceDetail extends GqlMaintenanceRequest {
  ambassador: string;
  programName: string;
  programCode: string;
  createdBy: string;
  completedOn: string | null;
  paid: boolean;
  assigneeKind: 'SUPERVISOR' | 'DEPARTMENT';
  department: string | null;
  zone: string | null;
  describeLocation: string | null;
  description: string | null;
  documents: string[];
  fixture: string | null;
  incidents: string[];
  pois: string[];
  equipment: string[];
  comments: MaintenanceComment[];
}

const toDetail = (d: GqlMaintenanceDetail): MaintenanceDetail => ({
  ...toRequest(d),
  ambassador: d.ambassador,
  programName: d.programName,
  programCode: d.programCode,
  createdBy: d.createdBy,
  completedOn: d.completedOn,
  paid: d.paid,
  assigneeKind: ASSIGNEE_KIND[d.assigneeKind],
  department: d.department,
  zone: d.zone,
  describeLocation: d.describeLocation,
  description: d.description,
  documents: d.documents,
  fixture: d.fixture,
  incidents: d.incidents,
  pois: d.pois,
  equipment: d.equipment,
  comments: d.comments,
});

const toWireInput = (values: MaintenanceFormValues) => ({
  type: values.type,
  requestedAt: values.requestedAt,
  assigneeKind:
    values.assigneeKind === 'Department' ? 'DEPARTMENT' : 'SUPERVISOR',
  department: values.department,
  priority: PRIORITY_OUT[values.priority],
  address: values.address,
  zone: values.zone,
  describeLocation: values.describeLocation || null,
  businessName: values.businessName,
  description: values.description || null,
  documents: values.documents,
  fixture: values.fixture,
  incidents: values.incidents,
  pois: values.pois,
  equipment: values.equipment,
});

/** The mock store mutates in place, so refetch rather than patch the cache. */
const REFRESH_LIST = {
  ...MAINTENANCE_CONTEXT,
  refetchQueries: ['GetMaintenanceRequests'],
};
const REFRESH_DETAIL = {
  ...MAINTENANCE_CONTEXT,
  refetchQueries: ['GetMaintenanceRequests', 'GetMaintenanceRequest'],
};
/**
 * Assigning a request also has to refresh Work's aggregated list (Home/Work
 * reads `workItems`, not `maintenanceRequests`) so a claimed/reassigned
 * request drops out of the Unassigned bucket there too.
 */
const REFRESH_ASSIGN = {
  ...MAINTENANCE_CONTEXT,
  refetchQueries: ['GetMaintenanceRequests', 'GetWorkItems'],
};

const CREATE_CONTEXT = {
  context: {feature: 'maintenance', offlineQueueKey: 'CREATE_MAINTENANCE_REQUEST'},
  refetchQueries: ['GetMaintenanceRequests'],
};

export function useGetMaintenanceRequestQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    maintenanceRequest: GqlMaintenanceDetail | null;
  }>(GET_MAINTENANCE_REQUEST, {...MAINTENANCE_CONTEXT, variables: {id}});

  const detail = useMemo(
    () => (data?.maintenanceRequest ? toDetail(data.maintenanceRequest) : null),
    [data],
  );

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}

export function useMaintenanceFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    maintenanceFormOptions: MaintenanceFormOptions;
  }>(GET_MAINTENANCE_FORM_OPTIONS, {
    ...MAINTENANCE_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // nextReference and quick-created fixtures have to be fresh on every open.
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.maintenanceFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

// Status changes come from the list, where the detail query isn't mounted —
// naming it here would make Apollo warn about refetching an inactive query.
export function useSetMaintenanceStatusMutation() {
  const [run, {loading}] = useMutation(SET_MAINTENANCE_STATUS, REFRESH_LIST);
  // Memoised because the list screens put this in a useCallback dependency
  // array — a fresh arrow each render would defeat the cards' React.memo.
  const mutate = useCallback(
    async (id: string, status: MaintenanceStatus) => {
      await run({variables: {id, status: STATUS_OUT[status]}});
    },
    [run],
  );
  return {mutate, isLoading: loading};
}

export function useAssignMaintenanceRequestMutation() {
  const [run, {loading}] = useMutation(
    ASSIGN_MAINTENANCE_REQUEST,
    REFRESH_ASSIGN,
  );
  const mutate = useCallback(
    async (
      id: string,
      kind: MaintenanceAssigneeKind,
      name: string,
    ) => {
      await run({
        variables: {
          id,
          assigneeKind: kind === 'Department' ? 'DEPARTMENT' : 'SUPERVISOR',
          assigneeName: kind === 'Department' ? null : name,
          department: kind === 'Department' ? name : null,
        },
      });
    },
    [run],
  );
  return {mutate, isLoading: loading};
}

export function useCreateMaintenanceRequestMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{
    createMaintenanceRequest: {id: string; reference: string};
  }>(CREATE_MAINTENANCE_REQUEST, CREATE_CONTEXT);
  return {
    mutate: async (values: MaintenanceFormValues) => {
      const result = await run({
        variables: {programId: programId ?? '', input: toWireInput(values)},
      });
      const id = result.data?.createMaintenanceRequest.id ?? '';
      return {
        id,
        reference: result.data?.createMaintenanceRequest.reference ?? '',
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useUpdateMaintenanceRequestMutation() {
  const [run, {loading}] = useMutation(
    UPDATE_MAINTENANCE_REQUEST,
    REFRESH_DETAIL,
  );
  return {
    mutate: async (id: string, values: MaintenanceFormValues) => {
      await run({variables: {id, input: toWireInput(values)}});
    },
    isLoading: loading,
  };
}

export function useDeleteMaintenanceRequestMutation() {
  const [run, {loading}] = useMutation(
    DELETE_MAINTENANCE_REQUEST,
    REFRESH_LIST,
  );
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}

export function useAddMaintenanceCommentMutation() {
  const [run, {loading}] = useMutation(ADD_MAINTENANCE_COMMENT, REFRESH_DETAIL);
  return {
    mutate: async (requestId: string, text: string, images: string[]) => {
      await run({variables: {requestId, text, images}});
    },
    isLoading: loading,
  };
}

export function useUpdateMaintenanceCommentMutation() {
  const [run, {loading}] = useMutation(
    UPDATE_MAINTENANCE_COMMENT,
    REFRESH_DETAIL,
  );
  return {
    mutate: async (
      requestId: string,
      commentId: string,
      text: string,
      images: string[],
    ) => {
      await run({variables: {requestId, commentId, text, images}});
    },
    isLoading: loading,
  };
}

export function useDeleteMaintenanceCommentMutation() {
  const [run, {loading}] = useMutation(
    DELETE_MAINTENANCE_COMMENT,
    REFRESH_DETAIL,
  );
  return {
    mutate: async (requestId: string, commentId: string) => {
      await run({variables: {requestId, commentId}});
    },
    isLoading: loading,
  };
}

export function useCreateMaintenanceFixtureMutation() {
  const [run, {loading}] = useMutation<{createMaintenanceFixture: string}>(
    CREATE_MAINTENANCE_FIXTURE,
    MAINTENANCE_CONTEXT,
  );
  return {
    mutate: async (name: string, fixtureType: string) => {
      const result = await run({variables: {name, fixtureType}});
      return result.data?.createMaintenanceFixture ?? name;
    },
    isLoading: loading,
  };
}
