import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {OfflineMutationKey} from '../../types/offlineQueue';
import {
  Equipment,
  EquipmentOwnership,
  EquipmentUnit,
} from '../../types/equipment';

interface CustodyMutationVariables {
  input: {id: string};
}

const CUSTODY_KEYS: OfflineMutationKey[] = [
  'CHECK_OUT_EQUIPMENT',
  'CHECK_IN_EQUIPMENT',
  'ADD_EQUIPMENT_UPKEEP',
];

/**
 * Unlike src/screens/fixture/pendingFixtureItems.ts, a queued equipment
 * custody mutation (check-out, check-in, add upkeep) is never a synthetic
 * row of its own — the equipment record it targets already exists in the
 * list. So this doesn't project placeholder Equipment records; it surfaces
 * the set of equipment ids that have a queued custody mutation sitting in
 * the outbox, so the list screen can mark the *existing* row
 * `queuedOffline: true` instead of prepending anything.
 *
 * All three custody mutations are called with `{input: {id, ...}}`
 * (equipment/hooks.ts), so the target id is always at `variables.input.id`.
 */
export function useQueuedEquipmentIds(): Set<string> {
  const outboxItems = GetOutboxItems();

  return useMemo(() => {
    const ids = new Set<string>();
    outboxItems.forEach(item => {
      if (!CUSTODY_KEYS.includes(item.mutationKey)) {
        return;
      }
      const variables = item.variables as unknown as CustodyMutationVariables;
      if (variables.input?.id) {
        ids.add(variables.input.id);
      }
    });
    return ids;
  }, [outboxItems]);
}

type WireOwnership = 'OWNED' | 'LEASED' | 'RENTED' | 'LOANED';
type WireUnit = 'MILES' | 'HOURS' | 'KILOMETERS' | 'NONE';

interface CreateEquipmentVariables {
  input: {
    serial: string;
    name: string;
    acquiredAt: string;
    category: string;
    equipmentType: string;
    make: string;
    model: string;
    unit: WireUnit;
    ownership: WireOwnership;
    year: string | null;
    beginningUsage: string | null;
    zone: string | null;
    description: string | null;
  };
}

// The queued variables carry the wire enums (toWireInput uppercases on the
// way out), so they have to be mapped back before they reach a card — a raw
// 'OWNED' or 'MILES' in a placeholder row would read as a bug.
const OWNERSHIP: Record<WireOwnership, EquipmentOwnership> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
  RENTED: 'Rented',
  LOANED: 'Loaned',
};
const UNIT: Record<WireUnit, EquipmentUnit> = {
  MILES: 'Miles',
  HOURS: 'Hours',
  KILOMETERS: 'Kilometers',
  NONE: 'None',
};

/**
 * Synthesizes a placeholder Equipment for each create still sitting in the
 * outbox. Unlike useQueuedEquipmentIds above — which marks a row that already
 * exists — a queued create has no record to mark, so the list has to be given
 * one, with a "Queued · offline" badge, until it syncs. Mirrors
 * usePendingFixtureItems in src/screens/fixture/pendingFixtureItems.ts.
 *
 * `program`, `region` and `division` are not part of EquipmentInput — the
 * resolver stamps them from the active program — so a placeholder genuinely
 * doesn't know them yet and shows blank until the synced record arrives.
 */
export function usePendingEquipmentItems(): Equipment[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_EQUIPMENT')
        .map((item): Equipment => {
          const {input} = item.variables as unknown as CreateEquipmentVariables;
          return {
            id: item.id,
            reference: 'Pending',
            serial: input.serial,
            name: input.name,
            equipmentType: input.equipmentType,
            category: input.category,
            make: input.make,
            model: input.model,
            zone: input.zone ?? '',
            program: '',
            region: '',
            division: '',
            // Matches the mock resolver's own create defaults
            // (equipment/resolvers.ts createEquipment): nothing is checked
            // out at the moment it's created, so it is never `mine`.
            status: 'Active',
            createdAt: item.createdAt,
            acquiredAt: input.acquiredAt,
            unit: UNIT[input.unit],
            beginningUsage: input.beginningUsage,
            year: input.year,
            ownership: OWNERSHIP[input.ownership],
            description: input.description,
            checkedOutBy: null,
            checkedOutAt: null,
            mine: false,
            queuedOffline: true,
          };
        }),
    [outboxItems],
  );
}
