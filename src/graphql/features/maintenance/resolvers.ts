import {MaintenanceDetail} from '../../../types/maintenance';
import {sleep} from '../../mockSession';
import {
  fixtureStore,
  nextReference as nextFixtureReference,
} from '../fixture/store';
import {FIXTURE_TYPES, ZONES} from '../shared/options';
import {
  BUSINESS_NAMES,
  DEPARTMENTS,
  AMBASSADORS,
  EQUIPMENT,
  INCIDENTS,
  MAINT_TYPES,
  POIS,
  findRecord,
  maintenanceStore,
  nextReference,
} from './store';

const STATUS: Record<string, string> = {
  Open: 'OPEN',
  'In-progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
};
const PRIORITY: Record<string, string> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
};
const ASSIGNEE_KIND: Record<string, string> = {
  Supervisor: 'SUPERVISOR',
  Department: 'DEPARTMENT',
  Ambassador: 'AMBASSADOR',
  Me: 'ME',
};

/** Display-shape record → wire shape (enums uppercased). */
export const toWire = (record: MaintenanceDetail) => ({
  ...record,
  status: STATUS[record.status],
  priority: PRIORITY[record.priority],
  assigneeKind: ASSIGNEE_KIND[record.assigneeKind],
});

const STATUS_IN: Record<string, MaintenanceDetail['status']> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In-progress',
  COMPLETED: 'Completed',
};
const PRIORITY_IN: Record<string, MaintenanceDetail['priority']> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
const ASSIGNEE_KIND_IN: Record<string, MaintenanceDetail['assigneeKind']> = {
  SUPERVISOR: 'Supervisor',
  DEPARTMENT: 'Department',
  AMBASSADOR: 'Ambassador',
  ME: 'Me',
};

/** 'John Carter' → 'JC', for the small avatar the cards and detail show. */
const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase();

interface WireInput {
  type: string;
  requestedAt: string;
  assigneeKind: string;
  department?: string | null;
  /**
   * Name of the person the request is assigned to, for the AMBASSADOR and ME
   * kinds. The client supplies it in both cases — including its own user's name
   * for ME — rather than the resolver reading it off the session, matching how
   * the rest of this mock takes identity from the caller.
   */
  ambassador?: string | null;
  priority: string;
  address: string;
  zone?: string | null;
  describeLocation?: string | null;
  businessName?: string | null;
  description?: string | null;
  documents?: string[] | null;
  fixture?: string | null;
  incidents?: string[] | null;
  pois?: string[] | null;
  equipment?: string[] | null;
}

const applyInput = (record: MaintenanceDetail, input: WireInput): void => {
  record.type = input.type;
  record.requestedAt = input.requestedAt;
  record.assigneeKind = ASSIGNEE_KIND_IN[input.assigneeKind];
  record.department = input.department ?? null;
  record.priority = PRIORITY_IN[input.priority];
  record.address = input.address;
  record.zone = input.zone ?? null;
  record.describeLocation = input.describeLocation ?? null;
  record.businessName = input.businessName ?? '';
  record.description = input.description ?? null;
  record.documents = input.documents ?? [];
  record.fixture = input.fixture ?? null;
  record.incidents = input.incidents ?? [];
  record.pois = input.pois ?? [];
  record.equipment = input.equipment ?? [];
  // Only a request handed to a supervisor waits for triage; the three choices a
  // supervisor makes for themselves all land on someone directly.
  record.routedToSupervisor = record.assigneeKind === 'Supervisor';

  // Assigning to a person names them on the record; routing to a supervisor or
  // a department leaves it unassigned, same as assignMaintenanceRequest does.
  if (record.assigneeKind === 'Ambassador' || record.assigneeKind === 'Me') {
    const name = input.ambassador ?? '';
    record.assignee = name ? {name, initials: initialsOf(name)} : null;
    record.ambassador = name;
    record.department = null;
  } else {
    record.assignee = null;
  }
};

export const maintenanceResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side.
    // When the server implements it, the document and call site already match.
    maintenanceRequests: async () => {
      await sleep();
      return maintenanceStore.records.map(toWire);
    },

    maintenanceRequest: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    maintenanceFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        types: MAINT_TYPES,
        zones: ZONES,
        departments: DEPARTMENTS,
        ambassadors: AMBASSADORS,
        businessNames: BUSINESS_NAMES,
        fixtures: fixtureStore.records.map(record => record.title),
        incidents: INCIDENTS,
        pois: POIS,
        equipment: EQUIPMENT,
        fixtureTypes: FIXTURE_TYPES,
      };
    },
  },

  Mutation: {
    setMaintenanceStatus: async (
      _: unknown,
      args: {id: string; status: string},
    ) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown maintenance request: ${args.id}`);
      }
      record.status = STATUS_IN[args.status];
      if (record.status === 'Completed') {
        record.completedBy = record.assignee?.name ?? record.completedBy;
        record.completedOn = new Date().toISOString();
      } else {
        record.completedBy = null;
        record.completedOn = null;
      }
      return toWire(record);
    },

    assignMaintenanceRequest: async (
      _: unknown,
      args: {
        id: string;
        assigneeKind: string;
        assigneeName?: string | null;
        department?: string | null;
      },
    ) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown maintenance request: ${args.id}`);
      }
      record.assigneeKind = ASSIGNEE_KIND_IN[args.assigneeKind];
      if (record.assigneeKind === 'Department') {
        record.department = args.department ?? null;
        record.assignee = null;
      } else {
        const name = args.assigneeName ?? '';
        record.department = null;
        record.assignee = {name, initials: initialsOf(name)};
      }
      // Keyed off the kind rather than "not a department": now that a
      // supervisor can assign to an ambassador or to themselves, those land on
      // a person and are not awaiting triage.
      record.routedToSupervisor = record.assigneeKind === 'Supervisor';
      return toWire(record);
    },

    createMaintenanceRequest: async (
      _: unknown,
      args: {programId: string; input: WireInput},
    ) => {
      await sleep();
      const reference = nextReference();
      const record: MaintenanceDetail = {
        id: `mt_${reference.replace('#MT-', '')}`,
        reference,
        type: '',
        status: 'Open',
        requestedAt: '',
        businessName: '',
        priority: 'Low',
        // Created by the Ambassador; a supervisor assigns it later.
        assignee: null,
        address: '',
        routedToSupervisor: true,
        queuedOffline: false,
        completedBy: null,
        ambassador: 'Tom Lee',
        programName: 'Louisville KY Training',
        programCode: 'BBB 0000',
        createdBy: 'Tom Lee',
        completedOn: null,
        paid: false,
        assigneeKind: 'Supervisor',
        department: null,
        zone: null,
        describeLocation: null,
        description: null,
        documents: [],
        fixture: null,
        incidents: [],
        pois: [],
        equipment: [],
        comments: [],
      };
      applyInput(record, args.input);
      maintenanceStore.records.unshift(record);
      return toWire(record);
    },

    updateMaintenanceRequest: async (
      _: unknown,
      args: {id: string; input: WireInput},
    ) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown maintenance request: ${args.id}`);
      }
      applyInput(record, args.input);
      return toWire(record);
    },

    deleteMaintenanceRequest: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = maintenanceStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown maintenance request: ${args.id}`);
      }
      maintenanceStore.records.splice(index, 1);
      return args.id;
    },

    addMaintenanceComment: async (
      _: unknown,
      args: {requestId: string; text: string; images?: string[] | null},
    ) => {
      await sleep();
      const record = findRecord(args.requestId);
      if (!record) {
        throw new Error(`Unknown maintenance request: ${args.requestId}`);
      }
      const comment = {
        id: `c${Date.now()}`,
        createdAt: new Date().toISOString(),
        text: args.text,
        edited: false,
        images: args.images ?? [],
      };
      record.comments.unshift(comment);
      return comment;
    },

    updateMaintenanceComment: async (
      _: unknown,
      args: {
        requestId: string;
        commentId: string;
        text: string;
        images?: string[] | null;
      },
    ) => {
      await sleep();
      const record = findRecord(args.requestId);
      const comment = record?.comments.find(c => c.id === args.commentId);
      if (!comment) {
        throw new Error(`Unknown comment: ${args.commentId}`);
      }
      comment.text = args.text;
      comment.edited = true;
      if (args.images) {
        comment.images = args.images;
      }
      return comment;
    },

    deleteMaintenanceComment: async (
      _: unknown,
      args: {requestId: string; commentId: string},
    ) => {
      await sleep();
      const record = findRecord(args.requestId);
      if (!record) {
        throw new Error(`Unknown maintenance request: ${args.requestId}`);
      }
      record.comments = record.comments.filter(c => c.id !== args.commentId);
      return args.commentId;
    },

    createMaintenanceFixture: async (
      _: unknown,
      args: {name: string; fixtureType: string},
    ) => {
      await sleep();
      const reference = nextFixtureReference();
      fixtureStore.records.unshift({
        id: `fx_${reference.replace('#FX-', '')}`,
        reference,
        title: args.name,
        fixtureType: args.fixtureType,
        zone: '',
        status: 'Active',
        createdBy: {name: 'You', initials: 'YO'},
        queuedOffline: false,
        createdAt: new Date().toISOString(),
        address: '',
        describeLocation: null,
        latitude: '30.673854',
        longitude: '73.673854',
        description: null,
        documents: [],
      });
      return args.name;
    },
  },
};
