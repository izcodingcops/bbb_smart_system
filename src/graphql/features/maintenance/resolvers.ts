import {MaintenanceDetail} from '../../../types/maintenance';
import {sleep} from '../../mockSession';
import {
  BUSINESS_NAMES,
  DEPARTMENTS,
  EQUIPMENT,
  FIXTURE_TYPES,
  INCIDENTS,
  MAINT_TYPES,
  POIS,
  ZONES,
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
};

/** Display-shape record → wire shape (enums uppercased, reference filled). */
export const toWire = (record: MaintenanceDetail) => ({
  ...record,
  reference: record.id,
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
};

interface WireInput {
  type: string;
  requestedAt: string;
  assigneeKind: string;
  department?: string | null;
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
        businessNames: BUSINESS_NAMES,
        fixtures: maintenanceStore.fixtures,
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

    createMaintenanceRequest: async (
      _: unknown,
      args: {programId: string; input: WireInput},
    ) => {
      await sleep();
      const record: MaintenanceDetail = {
        id: nextReference(),
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
      if (!maintenanceStore.fixtures.includes(args.name)) {
        maintenanceStore.fixtures.unshift(args.name);
      }
      return args.name;
    },
  },
};
