import {FixtureDetail} from '../../../types/fixture';
import {sleep} from '../../mockSession';
import {FIXTURE_TYPES, ZONES} from '../shared/options';
import {findRecord, fixtureStore, nextReference} from './store';

const STATUS: Record<string, string> = {Active: 'ACTIVE', Inactive: 'INACTIVE'};
const STATUS_IN: Record<string, FixtureDetail['status']> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

/** Display-shape record → wire shape (status uppercased). */
export const toWire = (record: FixtureDetail) => ({
  ...record,
  status: STATUS[record.status],
});

interface WireInput {
  title: string;
  serviceDateTime: string;
  fixtureType: string;
  status: string;
  address: string;
  zone?: string | null;
  describeLocation?: string | null;
  description?: string | null;
  documents?: string[] | null;
}

const applyInput = (record: FixtureDetail, input: WireInput): void => {
  record.title = input.title;
  record.createdAt = input.serviceDateTime;
  record.fixtureType = input.fixtureType;
  record.status = STATUS_IN[input.status];
  record.address = input.address;
  record.zone = input.zone ?? '';
  record.describeLocation = input.describeLocation ?? null;
  record.description = input.description ?? null;
  record.documents = input.documents ?? [];
};

export const fixtureResolvers = {
  Query: {
    // `filter` is accepted and ignored: the screen still filters client-side,
    // same convention as maintenanceRequests.
    fixtures: async () => {
      await sleep();
      return fixtureStore.records.map(toWire);
    },

    fixture: async (_: unknown, args: {id: string}) => {
      await sleep();
      const record = findRecord(args.id);
      return record ? toWire(record) : null;
    },

    fixtureFormOptions: async () => {
      await sleep();
      return {
        nextReference: nextReference(),
        fixtureTypes: FIXTURE_TYPES,
        zones: ZONES,
      };
    },
  },

  Mutation: {
    setFixtureStatus: async (_: unknown, args: {id: string; status: string}) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown fixture: ${args.id}`);
      }
      record.status = STATUS_IN[args.status];
      return toWire(record);
    },

    createFixture: async (
      _: unknown,
      args: {programId: string; input: WireInput},
    ) => {
      await sleep();
      const reference = nextReference();
      const record: FixtureDetail = {
        id: `fx_${reference.replace('#FX-', '')}`,
        reference,
        title: '',
        fixtureType: '',
        zone: '',
        status: 'Active',
        // Created by the Ambassador, same convention as Maintenance.
        createdBy: {name: 'You', initials: 'YO'},
        queuedOffline: false,
        createdAt: '',
        address: '',
        describeLocation: null,
        latitude: '30.673854',
        longitude: '73.673854',
        description: null,
        documents: [],
      };
      applyInput(record, args.input);
      fixtureStore.records.unshift(record);
      return toWire(record);
    },

    updateFixture: async (
      _: unknown,
      args: {id: string; input: WireInput},
    ) => {
      await sleep();
      const record = findRecord(args.id);
      if (!record) {
        throw new Error(`Unknown fixture: ${args.id}`);
      }
      applyInput(record, args.input);
      return toWire(record);
    },

    deleteFixture: async (_: unknown, args: {id: string}) => {
      await sleep();
      const index = fixtureStore.records.findIndex(r => r.id === args.id);
      if (index < 0) {
        throw new Error(`Unknown fixture: ${args.id}`);
      }
      fixtureStore.records.splice(index, 1);
      return args.id;
    },
  },
};
