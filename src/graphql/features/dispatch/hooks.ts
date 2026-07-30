import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Dispatch,
  DispatchDetail,
  DispatchEscalation,
  DispatchIncident,
  DispatchPriority,
  DispatchStatus,
} from '../../../types/dispatch';
import {GET_DISPATCH, GET_DISPATCHES} from './documents';

const DISPATCH_CONTEXT = {context: {feature: 'dispatch'}};

type WireStatus = 'OPEN' | 'ESCALATED' | 'CLOSED';
type WirePriority = 'LOW' | 'MEDIUM' | 'HIGH';

const STATUS: Record<WireStatus, DispatchStatus> = {
  OPEN: 'Open',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};

const PRIORITY: Record<WirePriority, DispatchPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

interface GqlDispatch {
  id: string;
  reference: string;
  typeOfActivity: string;
  howReferred: string;
  status: WireStatus;
  priority: WirePriority;
  createdAt: string;
  address: string;
}

const toDispatch = (d: GqlDispatch): Dispatch => ({
  id: d.id,
  reference: d.reference,
  typeOfActivity: d.typeOfActivity,
  howReferred: d.howReferred,
  status: STATUS[d.status],
  priority: PRIORITY[d.priority],
  createdAt: d.createdAt,
  address: d.address,
});

interface GqlDispatchIncident extends Omit<DispatchIncident, 'priority'> {
  priority: WirePriority;
}

interface GqlDispatchDetail extends GqlDispatch {
  createdBy: string;
  sourceNotes: string | null;
  location: string;
  locationNotes: string | null;
  tagSelected: string | null;
  classificationNotes: string | null;
  assignedRole: string | null;
  assignedIndividual: string | null;
  timeDispatched: string | null;
  timeArrived: string | null;
  timeCleared: string | null;
  initialOutcome: string | null;
  fullSquadResponse: string | null;
  outcomeNotes: string | null;
  escalations: DispatchEscalation[];
  incidents: GqlDispatchIncident[];
}

const toDetail = (d: GqlDispatchDetail): DispatchDetail => ({
  ...toDispatch(d),
  createdBy: d.createdBy,
  sourceNotes: d.sourceNotes,
  location: d.location,
  locationNotes: d.locationNotes,
  tagSelected: d.tagSelected,
  classificationNotes: d.classificationNotes,
  assignedRole: d.assignedRole,
  assignedIndividual: d.assignedIndividual,
  timeDispatched: d.timeDispatched,
  timeArrived: d.timeArrived,
  timeCleared: d.timeCleared,
  initialOutcome: d.initialOutcome,
  fullSquadResponse: d.fullSquadResponse,
  outcomeNotes: d.outcomeNotes,
  escalations: d.escalations,
  incidents: d.incidents.map(incident => ({
    ...incident,
    priority: PRIORITY[incident.priority],
  })),
});

/**
 * `filter` is wired into the document but sent as null: the screen filters,
 * sorts and searches client-side via src/screens/dispatch/filtering.ts, same
 * convention as Fixture and Maintenance.
 */
export function useGetDispatchesQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    dispatches: GqlDispatch[];
  }>(GET_DISPATCHES, {
    ...DISPATCH_CONTEXT,
    variables: {programId: programId ?? '', filter: null},
    skip: !programId,
  });

  // Memoised so the returned array keeps a stable identity between renders —
  // DispatchScreen feeds this into a useMemo dependency array.
  const dispatches = useMemo(
    () => (data?.dispatches ?? []).map(toDispatch),
    [data],
  );

  return {data: dispatches, isLoading: loading, isError: !!error, refetch};
}

export function useGetDispatchQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{
    dispatch: GqlDispatchDetail | null;
  }>(GET_DISPATCH, {...DISPATCH_CONTEXT, variables: {id}});

  const detail = useMemo(
    () => (data?.dispatch ? toDetail(data.dispatch) : null),
    [data],
  );

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}
