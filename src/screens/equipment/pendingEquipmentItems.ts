import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {OfflineMutationKey} from '../../types/offlineQueue';

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
