import {entryTypesForShift, WorkLogEntry, YesNo} from '../../../types/workLog';
import {sleep} from '../../mockSession';
import {BUSINESS_NAMES, ZONES} from '../shared/options';
import {findRecord, nextReference, workLogStore} from './store';

const YES_NO: Record<YesNo, string> = {yes: 'YES', no: 'NO'};
const YES_NO_IN: Record<string, YesNo> = {YES: 'yes', NO: 'no'};

/** Display-shape record -> wire shape (the five YesNo fields uppercased,
 *  staying null where the record's shift shape never set them). */
export const toWire = (record: WorkLogEntry) => ({
  ...record,
  machineNo: record.machineNo ?? null,
  fvmAccessibilityChecked: record.fvmAccessibilityChecked
    ? YES_NO[record.fvmAccessibilityChecked]
    : null,
  bridgePlateSecured: record.bridgePlateSecured
    ? YES_NO[record.bridgePlateSecured]
    : null,
  accessibleFareGateWorking: record.accessibleFareGateWorking
    ? YES_NO[record.accessibleFareGateWorking]
    : null,
  automaticDoorWorking: record.automaticDoorWorking
    ? YES_NO[record.automaticDoorWorking]
    : null,
  fvmNotWorking: record.fvmNotWorking ? YES_NO[record.fvmNotWorking] : null,
  description: record.description ?? null,
});

interface WireInput {
  entryType: string;
  requestDateTime: string;
  machineNo?: string | null;
  fvmAccessibilityChecked?: string | null;
  bridgePlateSecured?: string | null;
  accessibleFareGateWorking?: string | null;
  automaticDoorWorking?: string | null;
  fvmNotWorking?: string | null;
  description?: string | null;
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
  record.requestDateTime = input.requestDateTime;
  record.machineNo = input.machineNo ?? undefined;
  record.fvmAccessibilityChecked = input.fvmAccessibilityChecked
    ? YES_NO_IN[input.fvmAccessibilityChecked]
    : undefined;
  record.bridgePlateSecured = input.bridgePlateSecured
    ? YES_NO_IN[input.bridgePlateSecured]
    : undefined;
  record.accessibleFareGateWorking = input.accessibleFareGateWorking
    ? YES_NO_IN[input.accessibleFareGateWorking]
    : undefined;
  record.automaticDoorWorking = input.automaticDoorWorking
    ? YES_NO_IN[input.automaticDoorWorking]
    : undefined;
  record.fvmNotWorking = input.fvmNotWorking
    ? YES_NO_IN[input.fvmNotWorking]
    : undefined;
  record.description = input.description ?? undefined;
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

    workLogFormOptions: async (_: unknown, args: {shiftTypeId: string}) => {
      await sleep();
      return {
        nextReference: nextReference(),
        entryTypes: [...entryTypesForShift(args.shiftTypeId)],
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
        requestDateTime: '',
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
