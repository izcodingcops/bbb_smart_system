import {useMemo} from 'react';
import {useMutation, useQuery} from '@apollo/client/react';
import {GetActiveProgramId} from '../../../redux/auth/selectors';
import {
  Dispatch,
  DispatchDetail,
  DispatchEscalation,
  DispatchIncident,
  DispatchIncidentFormOptions,
  DispatchIncidentFormValues,
  DispatchPriority,
  DispatchStatus,
} from '../../../types/dispatch';
import {
  CREATE_DISPATCH_INCIDENT,
  GET_DISPATCH,
  GET_DISPATCHES,
  GET_DISPATCH_INCIDENT_FORM_OPTIONS,
} from './documents';

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

const PRIORITY_OUT: Record<DispatchPriority, WirePriority> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
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
  createdBy: string | null;
  sourceNotes: string | null;
  location: string | null;
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
  // Detail-only fields — nullable in the SDL because list queries don't
  // select them. Coalesced in toDetail below so DispatchDetail's arrays stay
  // guaranteed non-null for the rest of the app.
  escalations: DispatchEscalation[] | null;
  incidents: GqlDispatchIncident[] | null;
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
  escalations: d.escalations ?? [],
  incidents: (d.incidents ?? []).map(incident => ({
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

export function useDispatchIncidentFormOptionsQuery() {
  const programId = GetActiveProgramId();
  const {data, loading, error, refetch} = useQuery<{
    dispatchIncidentFormOptions: DispatchIncidentFormOptions;
  }>(GET_DISPATCH_INCIDENT_FORM_OPTIONS, {
    ...DISPATCH_CONTEXT,
    variables: {programId: programId ?? ''},
    skip: !programId,
    // nextReference has to be fresh on every open.
    fetchPolicy: 'network-only',
  });

  return {
    data: data?.dispatchIncidentFormOptions ?? null,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
}

const CREATE_CONTEXT = {
  context: {feature: 'dispatch', offlineQueueKey: 'CREATE_DISPATCH_INCIDENT'},
  refetchQueries: ['GetDispatch'],
};

/** A responder block is submitted whole, or not at all — see the SDL. */
const responderOrNull = (
  involved: boolean,
  block: {
    name: string;
    responder?: string;
    timeCalled: string | null;
    timeArrived: string | null;
  },
) =>
  involved
    ? {
        name: block.name.trim() || null,
        responder: block.responder?.trim() || null,
        timeCalled: block.timeCalled,
        timeArrived: block.timeArrived,
      }
    : null;

/** '' from a controlled input is not a value — the read sheet wants null. */
const orNull = (value: string) => value.trim() || null;

const toIncidentInput = (values: DispatchIncidentFormValues) => ({
  incidentType: values.incidentType,
  occurredAt: values.occurredAt,
  outcome: values.outcome,
  priority: PRIORITY_OUT[values.priority],
  address: values.address,
  describeLocation: orNull(values.describeLocation),
  zone: orNull(values.zone),
  businessName: orNull(values.businessName),
  notes: orNull(values.description),
  documentCount: values.documents.length,
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
  // `images` is dropped here on purpose: DispatchVehicle has no image field
  // and nothing renders one. The form still collects them because the design
  // shows the control — revisit when a gateway accepts uploads.
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
});

export function useCreateDispatchIncidentMutation() {
  const [run, {loading}] = useMutation<{
    createDispatchIncident: {id: string; reference: string; label: string};
  }>(CREATE_DISPATCH_INCIDENT, CREATE_CONTEXT);
  return {
    mutate: async (dispatchId: string, values: DispatchIncidentFormValues) => {
      const result = await run({
        variables: {dispatchId, input: toIncidentInput(values)},
      });
      const id = result.data?.createDispatchIncident.id ?? '';
      return {
        id,
        reference: result.data?.createDispatchIncident.reference ?? '',
        label: result.data?.createDispatchIncident.label ?? '',
        // offlineQueueLink stamps queued ids with this prefix (offlineQueue/link.ts)
        // — the same convention useCreateFixtureMutation already uses.
        queued: id.startsWith('outbox_'),
      };
    },
    isLoading: loading,
  };
}
