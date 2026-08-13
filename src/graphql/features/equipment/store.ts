import {EquipmentDetail} from '../../../types/equipment';
import {
  MOCK_EQUIPMENT,
  MOCK_EQUIPMENT_DETAIL_OVERRIDES,
} from '../../../mocks/equipment';

/**
 * Detail-only fields for every record the overrides map doesn't cover.
 *
 * A factory, not a shared object literal: spreading one literal into 25
 * records copies the *reference* to each empty array, so every record without
 * its own override would share one `upkeeps` array — and the next slice's
 * `addEquipmentUpkeep` unshifts in place, which would file one record's
 * upkeep against all of them.
 */
const detailDefaults = () => ({
  fuel: null as string | null,
  images: [] as string[],
  upkeeps: [] as EquipmentDetail['upkeeps'],
  incidents: [] as string[],
  personsOfInterest: [] as string[],
  maintenance: [] as string[],
});

/** Seeded once per app session; mutations edit this array in place. */
export const equipmentStore: {records: EquipmentDetail[]} = {
  records: MOCK_EQUIPMENT.map(item => ({
    ...detailDefaults(),
    ...item,
    ...MOCK_EQUIPMENT_DETAIL_OVERRIDES[item.id],
  })),
};

export function findRecord(id: string): EquipmentDetail | undefined {
  return equipmentStore.records.find(r => r.id === id);
}

/**
 * Matches on serial or reference, case-insensitively and with an optional
 * leading '#' on either side — a QR payload and a hand-typed number reach this
 * the same way.
 */
export function findByCode(code: string): EquipmentDetail | undefined {
  const needle = code.trim().toLowerCase().replace(/^#/, '');
  if (!needle) {
    return undefined;
  }
  return equipmentStore.records.find(
    r =>
      r.serial.toLowerCase() === needle ||
      r.reference.toLowerCase().replace(/^#/, '') === needle,
  );
}

/** One past the highest existing number, so created records sort to the top. */
export function nextReference(): string {
  const max = equipmentStore.records.reduce((acc, r) => {
    const n = Number(r.reference.replace('#', ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `#${max + 1}`;
}
