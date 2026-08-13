import {EquipmentDetail} from '../../../types/equipment';
import {sleep} from '../../mockSession';
import {equipmentStore, findByCode, findRecord} from './store';

/**
 * The create flow's list, not the hub mockup's — the hub ships real-world test
 * data ('12 Dec', '16 Jan Test Pre') that would look like a bug in the app.
 */
const UPKEEP_TYPES = [
  'Oil Change',
  'Tire Replacement',
  'Battery Service',
  'Body Work',
  'Drive Train Repair',
  'Brake Service',
  'Software Update',
  'Inspection',
  'Cleaning',
  'Other',
];

const ABNORMALITIES = [
  'Scratch / Dent',
  'Mechanical Issue',
  'Missing Part',
  'Screen/Display Damage',
  'Electrical Fault',
  'Fluid Leak',
  'Other',
];

/** Counter for upkeep ids; the store has no reference sequence for them. */
let upkeepSeq = 0;

function mustFind(id: string) {
  const record = findRecord(id);
  if (!record) {
    throw new Error(`Equipment ${id} not found`);
  }
  return record;
}

const STATUS_OUT = {
  Active: 'ACTIVE',
  'Checked-Out': 'CHECKED_OUT',
} as const;

const OWNERSHIP_OUT = {
  Owned: 'OWNED',
  Leased: 'LEASED',
  Rented: 'RENTED',
  Loaned: 'LOANED',
} as const;

const UNIT_OUT = {
  Miles: 'MILES',
  Hours: 'HOURS',
  Kilometers: 'KILOMETERS',
  None: 'NONE',
} as const;

/** App shape → wire shape. Every enum is uppercased here, nowhere else. */
function toWire(record: EquipmentDetail) {
  return {
    ...record,
    status: STATUS_OUT[record.status],
    ownership: OWNERSHIP_OUT[record.ownership],
    unit: UNIT_OUT[record.unit],
  };
}

/**
 * The detail projection additionally guarantees the list fields are arrays.
 * The SDL declares them non-null, and the store always populates them — but a
 * real gateway will not, and the mapper is the only place that can hold that
 * line cheaply.
 */
function toDetailWire(record: EquipmentDetail) {
  return {
    ...toWire(record),
    images: record.images ?? [],
    // Nested objects need the same enum discipline as the top level. There is
    // no enum on EquipmentUpkeep today; the spread is here so adding one later
    // doesn't quietly ship a lowercase value.
    upkeeps: (record.upkeeps ?? []).map(u => ({...u})),
    incidents: record.incidents ?? [],
    personsOfInterest: record.personsOfInterest ?? [],
    maintenance: record.maintenance ?? [],
  };
}

export const equipmentResolvers = {
  Query: {
    equipment: async () => {
      await sleep();
      return equipmentStore.records.map(toWire);
    },

    myEquipment: async () => {
      await sleep();
      return equipmentStore.records.filter(r => r.mine).map(toWire);
    },

    equipmentDetail: async (_: unknown, {id}: {id: string}) => {
      await sleep();
      const record = findRecord(id);
      return record ? toDetailWire(record) : null;
    },

    equipmentByCode: async (_: unknown, {code}: {code: string}) => {
      await sleep();
      const record = findByCode(code);
      return record ? toWire(record) : null;
    },

    equipmentFormOptions: async () => {
      await sleep();
      return {
        upkeepTypes: UPKEEP_TYPES,
        abnormalities: ABNORMALITIES,
        zones: Array.from(
          new Set(equipmentStore.records.map(r => r.zone)),
        ).sort(),
      };
    },
  },

  Mutation: {
    checkOutEquipment: async (
      _: unknown,
      {input}: {input: {id: string; occurredAt: string}},
    ) => {
      await sleep();
      const record = mustFind(input.id);
      record.status = 'Checked-Out';
      // 'You' is the holder convention across this app's mocks — see
      // src/mocks/fixture.ts's YOU. Keeps seeded records and freshly
      // checked-out ones reading identically.
      record.checkedOutBy = 'You';
      record.checkedOutAt = input.occurredAt;
      record.mine = true;
      return toDetailWire(record);
    },

    checkInEquipment: async (
      _: unknown,
      {input}: {input: {id: string}},
    ) => {
      await sleep();
      const record = mustFind(input.id);
      record.status = 'Active';
      record.checkedOutBy = null;
      record.checkedOutAt = null;
      record.mine = false;
      return toDetailWire(record);
    },

    addEquipmentUpkeep: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          id: string;
          upkeepType: string;
          occurredAt: string;
          vendor: string;
          currentUsage: string;
          cost: string;
          zone: string | null;
          description: string | null;
        };
      },
    ) => {
      await sleep();
      const record = mustFind(input.id);
      upkeepSeq += 1;
      // Unshift, not push — the detail screen renders upkeeps newest-first in
      // array order. Safe in place: each record owns its own array (store.ts's
      // detailDefaults() is a factory precisely so this cannot cross-file).
      record.upkeeps.unshift({
        id: `up_new_${upkeepSeq}`,
        upkeepType: input.upkeepType,
        occurredAt: input.occurredAt,
        vendor: input.vendor || null,
        cost: input.cost || null,
        currentUsage: input.currentUsage || null,
        zone: input.zone || null,
        description: input.description || null,
      });
      return toDetailWire(record);
    },
  },
};
