import {IncidentDetail, IncidentParty, IncidentPriority, IncidentStatus, IncidentVehicle} from '../../../types/incident';
import {sleep} from '../../mockSession';
import {MOCK_INCIDENT_FORM_OPTIONS} from '../../../mocks/incident';
import {findRecord, incidentStore, nextReference} from './store';

const STATUS: Record<IncidentDetail['status'], string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY: Record<IncidentDetail['priority'], string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};

/** Display-shape record → wire shape (both enums uppercased). Exported for Task 11's dispatch join. */
export const toWire = (record: IncidentDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
});

const STATUS_IN: Record<string, IncidentStatus> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY_IN: Record<'LOW' | 'MEDIUM' | 'HIGH', IncidentPriority> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
/** Maps the form's own display strings to the record's real status, since
 * "Report Status" and `status` are one field shown in two places. */
const STATUS_FROM_REPORT: Record<string, IncidentStatus> = {
  Open: 'Open',
  'In Progress': 'In-progress',
  Completed: 'Completed',
};

/** No responder involved — renders as four 'N/A' cells in the read model. */
const NO_RESPONDER = {name: null, responder: null, timeCalled: null, timeArrived: null};

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
  description: string | null;
  documents: string[] | null;
  reportStatus: string;
  supervisorStatus: string;
  police: WireResponderInput | null;
  fire: WireResponderInput | null;
  ems: WireResponderInput | null;
  clientName: string | null;
  parties: IncidentParty[];
  vehicles: IncidentVehicle[];
  fixture: string | null;
  connectedMaintenance: string[];
  connectedPois: string[];
  connectedEquipment: string[];
}

/** Shared by create and update — everything the form collects, applied in place. */
function applyInput(record: IncidentDetail, input: WireIncidentInput): void {
  record.type = input.incidentType;
  record.occurredAt = input.occurredAt;
  record.outcome = input.outcome;
  record.priority = PRIORITY_IN[input.priority];
  record.address = input.address;
  record.describeLocation = input.describeLocation;
  record.zone = input.zone ?? '';
  record.businessName = input.businessName ?? '';
  record.description = input.description;
  record.documents = input.documents ?? [];
  record.status = STATUS_FROM_REPORT[input.reportStatus] ?? 'Open';
  record.supervisorStatus = input.supervisorStatus;
  record.police = input.police ?? {...NO_RESPONDER};
  record.fire = input.fire ?? {...NO_RESPONDER};
  record.ems = input.ems ?? {...NO_RESPONDER};
  record.clientName = input.clientName;
  record.parties = input.parties;
  // Filter/search field only — not shown on the form, derived from the
  // primary party the way the seed data's own values read.
  record.person = input.parties[0]?.name || 'None';
  record.vehicles = input.vehicles;
  record.fixture = input.fixture;
  record.connectedMaintenance = input.connectedMaintenance;
  record.connectedPois = input.connectedPois;
  record.connectedEquipment = input.connectedEquipment;
}

export const incidentResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen filters, sorts and
    // searches client-side via src/screens/incident/filtering.ts, same
    // convention as Fixture, Maintenance and Dispatch.
    incidents: async () => {
      await sleep();
      return incidentStore.records.map(toWire);
    },

    incident: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    incidentFormOptions: async () => {
      await sleep();
      return {
        ...MOCK_INCIDENT_FORM_OPTIONS,
        nextReference: nextReference(),
      };
    },
  },

  Mutation: {
    setIncidentStatus: async (_: unknown, args: {id: string; status: string}) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown incident: ${args.id}`);
      }
      record.status = STATUS_IN[args.status];
      return toWire(record);
    },

    createIncident: async (
      _: unknown,
      args: {programId: string; input: WireIncidentInput; dispatchReference?: string | null},
    ) => {
      await sleep();
      const reference = nextReference();
      const record: IncidentDetail = {
        id: `inc_${reference.replace('#IN-', '')}`,
        reference,
        type: '',
        outcome: '',
        priority: 'Low',
        status: 'Open',
        occurredAt: '',
        // Created by the Ambassador; a supervisor assigns it later — same
        // convention as Fixture and Maintenance.
        assignee: null,
        person: 'None',
        businessName: '',
        zone: '',
        address: '',
        queuedOffline: false,
        dispatchReference: args.dispatchReference ?? null,
        ambassador: 'You',
        createdBy: 'You',
        supervisorStatus: 'In Progress',
        lastModifiedBy: 'You',
        lastModifiedAt: new Date().toISOString(),
        describeLocation: null,
        latitude: null,
        longitude: null,
        fixture: null,
        description: null,
        documents: [],
        police: {...NO_RESPONDER},
        fire: {...NO_RESPONDER},
        ems: {...NO_RESPONDER},
        clientName: null,
        parties: [],
        vehicles: [],
        connectedMaintenance: [],
        connectedPois: [],
        connectedEquipment: [],
        comments: [],
      };
      applyInput(record, args.input);
      incidentStore.records.unshift(record);
      return toWire(record);
    },

    updateIncident: async (_: unknown, args: {id: string; input: WireIncidentInput}) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown incident: ${args.id}`);
      }
      applyInput(record, args.input);
      record.lastModifiedBy = 'You';
      record.lastModifiedAt = new Date().toISOString();
      return toWire(record);
    },

    deleteIncident: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = incidentStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown incident: ${args.id}`);
      }
      incidentStore.records.splice(index, 1);
      return args.id;
    },
  },
};
