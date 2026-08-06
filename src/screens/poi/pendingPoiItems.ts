import {useMemo} from 'react';
import {GetOutboxItems} from '../../redux/outbox/selectors';
import {Poi, PoiDisposition} from '../../types/poi';

type WireDisposition =
  | 'ACTIVE'
  | 'DECEASED'
  | 'HOUSED'
  | 'IN_ACTIVE'
  | 'INCARCERATED'
  | 'TRANSITIONAL_CARE';

interface CreatePoiVariables {
  input: {
    name: string;
    personType: string;
    disposition: WireDisposition;
  };
}

const DISPOSITION: Record<WireDisposition, PoiDisposition> = {
  ACTIVE: 'Active',
  DECEASED: 'Deceased',
  HOUSED: 'Housed',
  IN_ACTIVE: 'In-active',
  INCARCERATED: 'Incarcerated',
  TRANSITIONAL_CARE: 'Transitional Care',
};

/**
 * Synthesizes a placeholder Poi for each person create still sitting in the
 * outbox, so it shows in the list — with a "Queued · offline" badge — before it
 * has actually synced. Mirrors usePendingFixtureItems in
 * src/screens/fixture/pendingFixtureItems.ts.
 *
 * Queued interactions and updates get no equivalent: neither has a list row of
 * its own to appear in. They surface on the person's timeline once they sync,
 * and their submit toast says so.
 *
 * Address and zone are stamped server-side (the person form has no Location
 * section), so a queued placeholder genuinely doesn't know them yet.
 */
export function usePendingPoiItems(): Poi[] {
  const outboxItems = GetOutboxItems();

  return useMemo(
    () =>
      outboxItems
        .filter(item => item.mutationKey === 'CREATE_POI')
        .map((item): Poi => {
          const variables = item.variables as unknown as CreatePoiVariables;
          return {
            id: item.id,
            reference: 'Pending',
            name: variables.input.name,
            personType: variables.input.personType,
            disposition: DISPOSITION[variables.input.disposition],
            zone: '',
            address: '',
            interactionCount: 0,
            // Matches the mock resolver's own creator convention
            // (poi/resolvers.ts createPoi).
            createdBy: {name: 'You', initials: 'YO'},
            queuedOffline: true,
            lastModifiedAt: item.createdAt,
          };
        }),
    [outboxItems],
  );
}
