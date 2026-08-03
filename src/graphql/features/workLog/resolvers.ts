import {ENTRY_TYPES, WorkLogEntry} from '../../../types/workLog';
import {sleep} from '../../mockSession';
import {ZONES} from '../shared/options';
import {BUSINESS_NAMES} from '../../../mocks/workLog';
import {findRecord, nextReference, workLogStore} from './store';

const YES_NO: Record<string, string> = {yes: 'YES', no: 'NO'};
const YES_NO_IN: Record<string, WorkLogEntry['fvmNotWorking']> = {
  YES: 'yes',
  NO: 'no',
};

/** Display-shape record → wire shape (the five YesNo fields uppercased). */
export const toWire = (record: WorkLogEntry) => ({
  ...record,
  fvmAccessibilityChecked: YES_NO[record.fvmAccessibilityChecked],
  bridgePlateSecured: YES_NO[record.bridgePlateSecured],
  accessibleFareGateWorking: YES_NO[record.accessibleFareGateWorking],
  automaticDoorWorking: YES_NO[record.automaticDoorWorking],
  fvmNotWorking: YES_NO[record.fvmNotWorking],
});

interface WireInput {
  entryType: string;
  machineNo: string;
  requestDateTime: string;
  fvmAccessibilityChecked: string;
  bridgePlateSecured: string;
  accessibleFareGateWorking: string;
  automaticDoorWorking: string;
  fvmNotWorking: string;
  address: string;
  zone?: string | null;
  describeLocation?: string | null;
  businessName?: string | null;
  quantity?: string | null;
  shiftTypeId?: string | null;
  shiftTypeName?: string | null;
}

/** Entry type and shift are locked after creation — never touched here. */
const applyInput = (record: WorkLogEntry, input: WireInput): void => {
  record.machineNo = input.machineNo;
  record.requestDateTime = input.requestDateTime;
  record.fvmAccessibilityChecked = YES_NO_IN[input.fvmAccessibilityChecked];
  record.bridgePlateSecured = YES_NO_IN[input.bridgePlateSecured];
  record.accessibleFareGateWorking = YES_NO_IN[input.accessibleFareGateWorking];
  record.automaticDoorWorking = YES_NO_IN[input.automaticDoorWorking];
  record.fvmNotWorking = YES_NO_IN[input.fvmNotWorking];
  record.address = input.address;
  record.zone = input.zone ?? null;
  record.describeLocation = input.describeLocation ?? '';
  record.businessName = input.businessName ?? null;
  record.quantity = input.quantity ?? '01';
};

export const workLogResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side,
    // same convention as Fixture and Maintenance.
    workLogEntries: async () => {
      await sleep();
      return workLogStore.records.map(toWire);
    },

    workLogEntry: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    workLogFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        entryTypes: [...ENTRY_TYPES],
        zones: ZONES,
        businessNames: BUSINESS_NAMES,
      };
    },
  },

  Mutation: {
    createWorkLogEntry: async (
      _: unknown,
      args: {programId: string; input: WireInput},
    ) => {
      await sleep();
      const reference = nextReference();
      const record: WorkLogEntry = {
        id: `wl_${reference.replace('#', '')}`,
        reference,
        shiftTypeId: args.input.shiftTypeId ?? '',
        shiftTypeName: args.input.shiftTypeName ?? 'Shift',
        entryType: args.input.entryType,
        machineNo: '',
        requestDateTime: '',
        fvmAccessibilityChecked: 'no',
        bridgePlateSecured: 'no',
        accessibleFareGateWorking: 'no',
        automaticDoorWorking: 'no',
        fvmNotWorking: 'no',
        address: '',
        zone: null,
        describeLocation: '',
        businessName: null,
        quantity: '01',
        // Logged by the Ambassador, same convention as Fixture/Maintenance.
        loggedBy: 'You',
        createdAt: new Date().toISOString(),
      };
      applyInput(record, args.input);
      workLogStore.records.unshift(record);
      return toWire(record);
    },

    updateWorkLogEntry: async (
      _: unknown,
      args: {id: string; input: WireInput},
    ) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown work log entry: ${args.id}`);
      }
      applyInput(record, args.input);
      return toWire(record);
    },

    deleteWorkLogEntry: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = workLogStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown work log entry: ${args.id}`);
      }
      workLogStore.records.splice(index, 1);
      return args.id;
    },
  },
};
