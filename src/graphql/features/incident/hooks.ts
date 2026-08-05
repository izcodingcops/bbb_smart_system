import {useMemo} from 'react';
import {useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Incident,
  IncidentAssignee,
  IncidentDetail,
  IncidentFormOptions,
  IncidentPriority,
  IncidentStatus,
} from '../../../types/incident';
import {GET_INCIDENT, GET_INCIDENTS, GET_INCIDENT_FORM_OPTIONS} from './documents';

export const INCIDENT_CONTEXT = {context: {feature: 'incident'}};

type WireStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
type WirePriority = 'LOW' | 'MEDIUM' | 'HIGH';

const STATUS: Record<WireStatus, IncidentStatus> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY: Record<WirePriority, IncidentPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export interface GqlIncident {
  id: string;
  reference: string;
  type: string;
  outcome: string;
  priority: WirePriority;
  status: WireStatus;
  occurredAt: string;
  assignee: IncidentAssignee | null;
  person: string;
  businessName: string;
  zone: string;
  address: string;
  queuedOffline: boolean;
  dispatchReference: string | null;
}

/** Wire → display shape. Exported: Task 12 reuses this for Dispatch's nested incidents. */
export const toIncidentFromWire = (i: GqlIncident): Incident => ({
  id: i.id,
  reference: i.reference,
  type: i.type,
  outcome: i.outcome,
  priority: PRIORITY[i.priority],
  status: STATUS[i.status],
  occurredAt: i.occurredAt,
  assignee: i.assignee,
  person: i.person,
  businessName: i.businessName,
  zone: i.zone,
  address: i.address,
  queuedOffline: i.queuedOffline,
  dispatchReference: i.dispatchReference,
});

export interface GqlIncidentDetail extends GqlIncident {
  ambassador: string | null;
  createdBy: string | null;
  supervisorStatus: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  describeLocation: string | null;
  latitude: string | null;
  longitude: string | null;
  fixture: string | null;
  description: string | null;
  documents: string[] | null;
  police: IncidentDetail['police'] | null;
  fire: IncidentDetail['fire'] | null;
  ems: IncidentDetail['ems'] | null;
  clientName: string | null;
  parties: IncidentDetail['parties'] | null;
  vehicles: IncidentDetail['vehicles'] | null;
  connectedMaintenance: string[] | null;
  connectedPois: string[] | null;
  connectedEquipment: string[] | null;
  comments: IncidentDetail['comments'] | null;
}

const NO_RESPONDER = {name: null, responder: null, timeCalled: null, timeArrived: null};

/** Wire → display shape, full detail. Exported: Task 12 reuses this for Dispatch's nested incidents. */
export const toIncidentDetailFromWire = (d: GqlIncidentDetail): IncidentDetail => ({
  ...toIncidentFromWire(d),
  ambassador: d.ambassador,
  createdBy: d.createdBy,
  supervisorStatus: d.supervisorStatus ?? 'In Progress',
  lastModifiedBy: d.lastModifiedBy,
  lastModifiedAt: d.lastModifiedAt,
  describeLocation: d.describeLocation,
  latitude: d.latitude,
  longitude: d.longitude,
  fixture: d.fixture,
  description: d.description,
  documents: d.documents ?? [],
  police: d.police ?? {...NO_RESPONDER},
  fire: d.fire ?? {...NO_RESPONDER},
  ems: d.ems ?? {...NO_RESPONDER},
  clientName: d.clientName,
  parties: d.parties ?? [],
  vehicles: d.vehicles ?? [],
  connectedMaintenance: d.connectedMaintenance ?? [],
  connectedPois: d.connectedPois ?? [],
  connectedEquipment: d.connectedEquipment ?? [],
  comments: d.comments ?? [],
});

/**
 * `filter` is wired into the document but sent as null: the screen filters,
 * sorts and searches client-side via src/screens/incident/filtering.ts.
 */
export function useGetIncidentsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{incidents: GqlIncident[]}>(GET_INCIDENTS, {
    ...INCIDENT_CONTEXT,
    variables: {programId: programId ?? '', filter: null},
    skip: !programId,
  });

  const incidents = useMemo(() => (data?.incidents ?? []).map(toIncidentFromWire), [data]);

  return {data: incidents, isLoading: loading, isError: !!error, refetch};
}

export function useGetIncidentQuery(id: string) {
  const {data, loading, error, refetch} = useQuery<{incident: GqlIncidentDetail | null}>(
    GET_INCIDENT,
    {...INCIDENT_CONTEXT, variables: {id}},
  );

  const detail = useMemo(() => (data?.incident ? toIncidentDetailFromWire(data.incident) : null), [data]);

  return {data: detail, isLoading: loading, isError: !!error, refetch};
}

export function useIncidentFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{incidentFormOptions: IncidentFormOptions}>(
    GET_INCIDENT_FORM_OPTIONS,
    {
      ...INCIDENT_CONTEXT,
      variables: {programId: programId ?? ''},
      skip: !programId,
      // nextReference has to be fresh on every open.
      fetchPolicy: 'network-only',
    },
  );

  return {data: data?.incidentFormOptions ?? null, isLoading: loading, isError: !!error, refetch};
}
