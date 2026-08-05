import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Incident,
  IncidentAssignee,
  IncidentDetail,
  IncidentFormOptions,
  IncidentFormValues,
  IncidentPriority,
  IncidentStatus,
} from '../../../types/incident';
import {CREATE_INCIDENT, DELETE_INCIDENT, GET_INCIDENT, GET_INCIDENTS, GET_INCIDENT_FORM_OPTIONS, SET_INCIDENT_STATUS, UPDATE_INCIDENT} from './documents';

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

const PRIORITY_OUT: Record<IncidentPriority, WirePriority> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

/** A responder block is submitted whole, or not at all. */
const responderOrNull = (
  involved: boolean,
  block: {name: string; responder?: string; timeCalled: string | null; timeArrived: string | null},
) =>
  involved
    ? {
        name: block.name.trim() || null,
        responder: block.responder?.trim() || null,
        timeCalled: block.timeCalled,
        timeArrived: block.timeArrived,
      }
    : null;

/** '' from a controlled input is not a value — the read model wants null. */
const orNull = (value: string) => value.trim() || null;

function toIncidentInput(values: IncidentFormValues) {
  return {
    incidentType: values.incidentType,
    occurredAt: values.occurredAt,
    outcome: values.outcome,
    priority: PRIORITY_OUT[values.priority],
    address: values.address,
    describeLocation: orNull(values.describeLocation),
    zone: orNull(values.zone),
    businessName: orNull(values.businessName),
    description: orNull(values.description),
    documents: values.documents,
    reportStatus: values.reportStatus,
    supervisorStatus: values.supervisorStatus,
    police: responderOrNull(values.policeInvolved, {
      name: values.policeOfficerName,
      timeCalled: values.policeTimeCalled,
      timeArrived: values.policeTimeArrived,
    }),
    fire: responderOrNull(values.fireInvolved, {
      name: values.fireEngineName,
      timeCalled: values.fireTimeCalled,
      timeArrived: values.fireTimeArrived,
    }),
    ems: responderOrNull(values.emsInvolved, {
      name: values.emsCompanyName,
      responder: values.emsResponderName,
      timeCalled: values.emsTimeCalled,
      timeArrived: values.emsTimeArrived,
    }),
    clientName: values.clientInvolved ? orNull(values.clientName) : null,
    parties: values.parties.map(party => ({
      name: orNull(party.name),
      type: orNull(party.type),
      organization: orNull(party.organization),
      streetAddress: orNull(party.streetAddress),
      phone: orNull(party.phone),
      email: orNull(party.email),
    })),
    // `images` is dropped here on purpose: IncidentVehicle has no image field
    // and nothing renders one — the form still collects them because the
    // design shows the control.
    vehicles: values.vehicles.map(vehicle => ({
      year: orNull(vehicle.year),
      make: orNull(vehicle.make),
      model: orNull(vehicle.model),
      color: orNull(vehicle.color),
      licenseNumber: orNull(vehicle.licenseNumber),
    })),
    fixture: orNull(values.fixture),
    connectedMaintenance: values.connectedMaintenance,
    connectedPois: values.connectedPois,
    connectedEquipment: values.connectedEquipment,
  };
}

const REFRESH_LIST = {...INCIDENT_CONTEXT, refetchQueries: ['GetIncidents']};
const REFRESH_DETAIL = {...INCIDENT_CONTEXT, refetchQueries: ['GetIncidents', 'GetIncident']};

// Offline queue opt-in (offlineQueueKey) is added in a later task.
const CREATE_CONTEXT = {context: {feature: 'incident'}, refetchQueries: ['GetIncidents']};

export function useSetIncidentStatusMutation() {
  const [run, {loading}] = useMutation(SET_INCIDENT_STATUS, REFRESH_LIST);
  const mutate = async (id: string, status: IncidentStatus) => {
    const STATUS_IN_OUT: Record<IncidentStatus, WireStatus> = {
      Open: 'OPEN',
      'In-progress': 'IN_PROGRESS',
      Completed: 'COMPLETED',
    };
    await run({variables: {id, status: STATUS_IN_OUT[status]}});
  };
  return {mutate, isLoading: loading};
}

export function useCreateIncidentMutation() {
  const programId = GetActiveProgramId();
  const [run, {loading}] = useMutation<{createIncident: {id: string; reference: string}}>(
    CREATE_INCIDENT,
    CREATE_CONTEXT,
  );
  return {
    mutate: async (values: IncidentFormValues, options?: {dispatchReference?: string}) => {
      const result = await run({
        variables: {
          programId: programId ?? '',
          input: toIncidentInput(values),
          dispatchReference: options?.dispatchReference ?? null,
        },
      });
      const id = result.data?.createIncident.id ?? '';
      return {
        id,
        reference: result.data?.createIncident.reference ?? '',
        // offlineQueueLink stamps queued ids with this prefix.
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}

export function useUpdateIncidentMutation() {
  const [run, {loading}] = useMutation(UPDATE_INCIDENT, REFRESH_DETAIL);
  return {
    mutate: async (id: string, values: IncidentFormValues) => {
      await run({variables: {id, input: toIncidentInput(values)}});
    },
    isLoading: loading,
  };
}

export function useDeleteIncidentMutation() {
  const [run, {loading}] = useMutation(DELETE_INCIDENT, REFRESH_LIST);
  return {
    mutate: async (id: string) => {
      await run({variables: {id}});
    },
    isLoading: loading,
  };
}
