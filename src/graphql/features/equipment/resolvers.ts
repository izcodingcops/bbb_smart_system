import {EquipmentDetail} from '../../../types/equipment';
import {MOCK_CHECKED_IN_EQUIPMENT} from '../../../mocks/equipment';
import {sleep} from '../../mockSession';
import {equipmentStore, findByCode, findRecord} from './store';

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

const LEGACY_STATUS: Record<string, string> = {Active: 'ACTIVE', Overdue: 'OVERDUE'};

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

    /** Legacy — Home's checked-in card. Removed in Task 6. */
    checkedInEquipment: async () => {
      await sleep();
      return MOCK_CHECKED_IN_EQUIPMENT.map(item => ({
        id: item.id,
        assetTag: item.id,
        name: item.name,
        category: item.category,
        checkedInAt: item.checkedInAt,
        status: LEGACY_STATUS[item.status],
        icon: item.icon,
        tint: item.tint,
        iconColor: item.iconColor,
      }));
    },
  },
};
