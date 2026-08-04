import {
  DispatchDetail,
  DispatchIncident,
  DispatchParty,
  DispatchPriority,
  DispatchStatus,
  DispatchVehicle,
} from '../../../types/dispatch';
import {sleep} from '../../mockSession';
import {MOCK_DISPATCH_INCIDENT_OPTIONS} from '../../../mocks/dispatch';
import {addIncident, dispatchStore, findRecord, nextIncidentReference} from './store';

const STATUS: Record<DispatchStatus, string> = {
  Open: 'OPEN',
  Escalated: 'ESCALATED',
  Closed: 'CLOSED',
};

const PRIORITY: Record<DispatchPriority, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

const incidentToWire = (incident: DispatchIncident) => ({
  ...incident,
  priority: PRIORITY[incident.priority],
});

/** Display-shape record → wire shape (both enums uppercased). */
export const toWire = (record: DispatchDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
  incidents: record.incidents.map(incidentToWire),
});

interface WireResponderInput {
  name: string | null;
  responder: string | null;
  timeCalled: string | null;
  timeArrived: string | null;
}

interface WireIncidentInput {
  incidentType: string;
  occurredAt: string;
  outcome: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  address: string;
  describeLocation: string | null;
  zone: string | null;
  businessName: string | null;
  notes: string | null;
  documentCount: number;
  reportStatus: string;
  supervisorStatus: string;
  police: WireResponderInput | null;
  fire: WireResponderInput | null;
  ems: WireResponderInput | null;
  clientName: string | null;
  parties: DispatchParty[];
  vehicles: DispatchVehicle[];
  fixture: string | null;
  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];
}

const PRIORITY_IN: Record<'LOW' | 'MEDIUM' | 'HIGH', DispatchPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/** An unanswered involvement block becomes four nulls, not an absent object. */
const NO_RESPONDER = {
  name: null,
  responder: null,
  timeCalled: null,
  timeArrived: null,
};

export const dispatchResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side,
    // same convention as fixtures and maintenanceRequests.
    dispatches: async () => {
      await sleep();
      return dispatchStore.records.map(toWire);
    },

    dispatch: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    dispatchIncidentFormOptions: async () => {
      await sleep();
      return {
        ...MOCK_DISPATCH_INCIDENT_OPTIONS,
        nextReference: nextIncidentReference(),
      };
    },
  },

  Mutation: {
    createDispatchIncident: async (
      _: unknown,
      args: {dispatchId: string; input: WireIncidentInput},
    ) => {
      await sleep();
      const parent = findRecord(args.dispatchId);
      if (!parent) {
        throw new Error(`No dispatch with id ${args.dispatchId}`);
      }

      const {input} = args;
      const reference = nextIncidentReference();
      const incident: DispatchIncident = {
        id: `inc_${reference.replace('#', '')}`,
        reference,
        // Labels count within the parent, so this is the parent's own count
        // plus one — not a global counter.
        label: `Incident ${parent.incidents.length + 1}`,
        // Created by the Ambassador, same convention as Fixture and Maintenance.
        createdBy: 'You',
        priority: PRIORITY_IN[input.priority],
        incidentType: input.incidentType,
        occurredAt: input.occurredAt,
        outcome: input.outcome,
        notes: input.notes,
        ambassador: 'You',
        reportStatus: input.reportStatus,
        supervisorStatus: input.supervisorStatus,
        address: input.address,
        describeLocation: input.describeLocation,
        // Not collected by the form; a real gateway derives them from the
        // address it was given.
        latitude: null,
        longitude: null,
        zone: input.zone,
        businessName: input.businessName,
        fixture: input.fixture,
        documentCount: input.documentCount,
        lastModifiedBy: 'You',
        lastModifiedAt: input.occurredAt,
        police: input.police ?? {...NO_RESPONDER},
        fire: input.fire ?? {...NO_RESPONDER},
        ems: input.ems ?? {...NO_RESPONDER},
        clientName: input.clientName,
        parties: input.parties,
        vehicles: input.vehicles,
        connectedMaintenance: input.connectedMaintenance,
        connectedPois: input.connectedPois,
        connectedEquipment: input.connectedEquipment,
      };

      addIncident(args.dispatchId, incident);
      // Through incidentToWire, not returned raw — the nested priority enum
      // has to go back uppercased, the same as every seeded incident does.
      return incidentToWire(incident);
    },
  },
};
